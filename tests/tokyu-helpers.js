const {expect} = require('@playwright/test')

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
function FormatCalendarDate(date)
{
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function createTokyuHelpers(info)
{
    //Generates a password that's guaranteed to differ from whatever the account's password currently is
    function GenerateFreshPassword()
    {
        return "Newpassword" + Date.now().toString().slice(-6)
    }


    //Helper Functions

    //SmartClub rolled out a Terms of Use revision, and any account that hasn't yet agreed to it gets redirected to an
    //interstitial /mypage/agreement page right after submitting login credentials (before being sent back to the Stay
    //site). The page has two quirks: (1) "Agree and log in" stays disabled until its (unclassed) terms container is
    //scrolled to the bottom, so it has to be scrolled via JS rather than a locator; (2) the page renders two overlapping
    //copies of the same modal (desktop/mobile duplicates) that both report as visible, so a plain click on the button
    //gets blocked by "intercepts pointer events" - click with force to route around that. Once an account agrees, this
    //page is skipped on all future logins for that account, so this is a one-time, no-op-afterwards detour.
    async function AgreeToTermsRevisionIfPresent(arg_page)
    {
        if(!arg_page.url().includes("/mypage/agreement"))
            return

        await arg_page.evaluate(() =>
        {
            for(const el of document.querySelectorAll("*"))
            {
                const style = getComputedStyle(el)
                if((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 5)
                    el.scrollTop = el.scrollHeight
            }
        })

        const agreeButton = arg_page.locator("#mypageAgreeButton").first()
        await expect(agreeButton).toBeEnabled()
        await agreeButton.click({force: true})
        await arg_page.waitForURL("https://stg.reservation.tokyustay.co.jp/en")
    }

    async function Login(arg_page)
    {
        await arg_page.goto("https://stg.reservation.tokyustay.co.jp/en");
        await expect(arg_page).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');
        await arg_page.getByRole("button", {name: "Log In"}).click()

        await expect(arg_page).toHaveURL("https://test-smartclub.metroengines.jp/mypage/login")
        await arg_page.locator("input[name='email']").fill(info.fixedEmail)
        await arg_page.locator("input[name='password']").fill(info.fixedPassword)
        await arg_page.locator("button.c-button").click()
        //NOTE: waits for either the Terms revision interstitial or the final homepage, so the check below is never racing the redirect
        await arg_page.waitForURL(url => url.href.includes("/mypage/agreement") || url.href === "https://stg.reservation.tokyustay.co.jp/en")
        await AgreeToTermsRevisionIfPresent(arg_page)
        await arg_page.locator("div.space-x-2").waitFor()
        const pointVisible = await arg_page.locator("div.space-x-2").isVisible()
        expect(pointVisible).toBeTruthy()

        return arg_page
    }

    //An index-based SVG click in the search panel can silently enable Kitchenette, which filters out every room for
    //the staging hotel. Reset the named amenity checkboxes before searching rather than clicking an unrelated icon.
    async function ClearAmenityFilters(arg_page)
    {
        for(const name of ["Washer&Dryer", "Kitchenette", "Microwave"])
        {
            const checkbox = arg_page.getByRole("checkbox", {name}).first()
            if(await checkbox.isChecked())
                await checkbox.uncheck({force: true})
            await expect(checkbox).not.toBeChecked()
        }
    }

    //Selects the first enabled non-resale "Book now" button in the Available Plans grid and clicks it.
    //NOTE (2026-08-29): default drop is sorted cheap-first, so today the only enabled plan is a "[Resale Plan]" which is
    //NOT points-eligible (its payment page shows "Points to be earned: 0pt" and refuses point redemption). The booking
    //tests assert points > 0 / solit the payment-gateway modal, so they must pick a regular (non-resale) plan instead.
    //A resale card's container (div.relative.pt-4.space-y-4) contains "RESALE AVAILABLE" text; skip those. Non-resale
    //regular / membership plans still show "Book now" even when the resale one is the cheapest, so a non-resale result
    //remains findable. Falls back to any enabled plan if no non-resale one is enabled (so the helper never hangs) -
    //unless requireNonResale is true, in which case only a non-resale (Standard) plan may be picked and a missing one
    //fails the test rather than silently buying a resale plan.
    async function ClickFirstBookableNonResalePlan(page1, requireNonResale = false)
    {
        const bookNowButtons = page1.getByRole("button", {name: "Book now"})
        await expect(bookNowButtons.first()).toBeVisible()

        //Retry: a non-resale button may still be disabled (inventory/price still resolving) for a moment after the grid
        //first renders, and the resale card is enabled instantly - a single pass then wrongly falls back to the resale plan.
        for(let attempt = 0; attempt < 5; attempt++)
        {
            const bookNowCount = await bookNowButtons.count()
            for(let i = 0; i < bookNowCount; i++)
            {
                const btn = bookNowButtons.nth(i)
                if(!(await btn.isEnabled()))
                    continue

                //Resale cards are not points-eligible; skip them so the Points-to-Be-Earned assertions hold.
                const isResale = await btn.evaluate(el =>
                {
                    let c = el
                    for(let k = 0; k < 6 && c.parentElement; k++) c = c.parentElement
                    return /RESALE AVAILABLE/i.test(c.innerText || "")
                })

                if(!isResale)
                {
                    await btn.click()
                    return
                }
            }
            await page1.waitForTimeout(800) //Grid still settling - let the non-resale buttons a moment to enable before the next scan
        }

        //No non-resale plan enabled within the poll window. When requireNonResale is set, that is a hard requirement
        //(resale plans break the points assertions), so fail clearly instead of blindly falling back to a resale plan.
        if(requireNonResale)
            throw new Error("No enabled non-resale (Standard) plan was available to book")

        //Otherwise fall back to the first enabled button so the flow still proceeds.
        const bookNowCount = await bookNowButtons.count()
        for(let i = 0; i < bookNowCount; i++)
        {
            if(await bookNowButtons.nth(i).isEnabled())
            {
                await bookNowButtons.nth(i).click()
                return
            }
        }
        throw new Error("No enabled 'Book now' button found in the Available Plans grid")
    }

    //After submitting payment details the gateway either appears or the form displays a validation/backend error.
    //Bound the wait and include visible errors so a missing gateway is not misreported as a 200-second iframe timeout.
    async function ProceedThroughPaymentGateway(arg_page)
    {
        const gatewayButton = arg_page.frameLocator("iframe").getByRole("button", {name: "決済に進む"}).first()
        try
        {
            await gatewayButton.waitFor({state: "visible", timeout: 20 * 1000})
        }
        catch(e)
        {
            const fieldErrors = await arg_page.locator("form p.text-error, form [role='alert'], [aria-invalid='true']")
                .allTextContents()
            const validity = await arg_page.locator("form input:invalid").evaluateAll(inputs =>
                inputs.map(input => ({name: input.name, message: input.validationMessage})))
            const frames = arg_page.frames().map(frame => frame.url().split("?")[0])
            const formState = await arg_page.locator("input, button[type='submit']").evaluateAll(elements =>
                elements.map(el => ({name: el.name || el.textContent?.trim()?.slice(0, 25),
                    disabled: el.disabled, valid: typeof el.checkValidity === "function" ? el.checkValidity() : null,
                    validation: el.validationMessage || null})))
            throw new Error(`Payment gateway did not appear after Confirm. Field errors: ${JSON.stringify(fieldErrors)}; invalid inputs: ${JSON.stringify(validity)}; frames: ${JSON.stringify(frames)}; form state: ${JSON.stringify(formState)}`)
        }
        await gatewayButton.click()
    }

    //InstAddr guards its login/address actions with an invisible Google reCAPTCHA that normally passes silently, but
    //repeated automated runs from the same IP/browser can push it to fall back to showing the classic "I'm not a robot"
    //checkbox challenge. When that happens the checkbox just needs a click (no image/puzzle solving involved), so poll
    //briefly for the reCAPTCHA iframe and click it if it shows up; if it never appears this is a harmless no-op.
    async function DismissRecaptchaCheckboxIfPresent(instAddrPage, timeoutMs = 5 * 1000)
    {
        const recaptchaCheckbox = instAddrPage.frameLocator("iframe[title='reCAPTCHA']").locator("#recaptcha-anchor")

        try
        {
            await recaptchaCheckbox.waitFor({state: "visible", timeout: timeoutMs})
        }
        catch(e)
        {
            return //No challenge appeared within the wait - proceed as normal
        }

        await recaptchaCheckbox.click()
        await instAddrPage.waitForTimeout(2 * 1000) //Give Google a moment to validate the click before the caller continues
    }

    //InstAddr can present either Cloudflare's entry check or a second human-verification page while
    //creating its anonymous account. Wait for the person to complete either one in headed runs.
    async function WaitForInstAddrReady(instAddrPage, readyLocator)
    {
        const manualVerification = process.env.INSTADDR_MANUAL_VERIFICATION === "1"
        const deadline = Date.now() + (manualVerification ? 5 * 60 * 1000 : 20 * 1000)
        let lastChallenge

        while(Date.now() < deadline)
        {
            try
            {
                //A human verification click can navigate between polls, briefly destroying the page context.
                const challenge = (await instAddrPage.title()) === "Just a moment..." ? "Cloudflare" :
                    instAddrPage.url().includes("/recaptcha_createaccount.php") ? "InstAddr account" : null
                if(challenge !== lastChallenge && challenge && manualVerification)
                    console.log(`ACTION REQUIRED: Complete the ${challenge} "Verify you are human" checkbox in the InstAddr browser window; waiting up to 5 minutes.`)
                lastChallenge = challenge

                if(!challenge && await readyLocator.isVisible())
                    return
            }
            catch(e)
            {
                if(!/Execution context was destroyed|navigation/i.test(e.message))
                    throw e
            }
            await instAddrPage.waitForTimeout(500)
        }

        throw new Error(lastChallenge
            ? `InstAddr ${lastChallenge} human verification was not completed`
            : "InstAddr page did not finish loading")
    }

    //Logs the given InstAddr page into the shared account, handling the occasional reCAPTCHA checkbox challenge
    //(see DismissRecaptchaCheckboxIfPresent()) that can appear right after submitting the login form.
    async function LoginToInstAddr(instAddrPage)
    {
        await instAddrPage.goto("https://m.kuku.lu/en.php")
        //The page briefly renders neither the address list nor the login controls after verification clears.
        await WaitForInstAddrReady(instAddrPage,
            instAddrPage.getByRole("link", {name: "Create an address automatically"}))
        if(await instAddrPage.locator("#link_loginform").count() === 0)
            return //An existing InstAddr account session is already active

        await instAddrPage.goto("https://m.kuku.lu/index.php?pagemode_login=1&noindex=1")
        await WaitForInstAddrReady(instAddrPage, instAddrPage.locator("#link_loginform"))
        await instAddrPage.locator("#link_loginform").click()
        await instAddrPage.getByPlaceholder("AccountID").fill(info.instAddrAccountID)
        await instAddrPage.locator("#user_password").fill(info.instAddrPassword)
        await instAddrPage.locator("a[href*='checkLogin()']").click()
        await DismissRecaptchaCheckboxIfPresent(instAddrPage)
        await instAddrPage.locator("#area-confirm-dialog-button-ok").click()
    }

    //Logs into the shared InstAddr account and generates a brand-new, never-used temporary email address via its
    //"Create an address automatically" feature, so tests never need a manually maintained fresh-address fixture.
    //Returns the context/page (left open and logged in, so the caller can reuse it to check the inbox afterward) and the new address.
    async function CreateInstAddrTempEmail(browser)
    {
        const instAddrContext = await browser.newContext()
        const instAddrPage = await instAddrContext.newPage()
        await LoginToInstAddr(instAddrPage)

        await instAddrPage.getByRole("link", {name: "Create an address automatically"}).click()

        //The account may be prompted to accept the Terms of Use (EULA) the first time it creates an address - click "Yes"
        //to dismiss that modal so the address-capture popup (or the address list itself) actually appears.
        const eulaDialog = instAddrPage.getByRole("dialog").filter({hasText: "Terms of Use (EULA)"})
        if(await eulaDialog.count() > 0)
        {
            await instAddrPage.getByText("Yes", {exact: true}).last().click()
            await instAddrPage.waitForTimeout(1 * 1000)
        }

        await DismissRecaptchaCheckboxIfPresent(instAddrPage)
        //The new address is surfaced in a popup whose copy varies (a "Notice" box with the address in <b>, or a dialog),
        //so read the address from the visible popup's body instead of a brittle single noticebox. Fall back to grabbing
        //the newest address from the just-updated address list if no popup text is found.
        let newEmail
        const addressIpup = instAddrPage.locator("div.noticebox, [class*='dialog']").filter({hasText: /@/}).last()
        if(await addressIpup.count() > 0)
        {
            const popupText = await addressIpup.textContent()
            const match = (popupText || "").match(/[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
            newEmail = match ? match[0] : null
        }
        else
        {
            newEmail = await instAddrPage.locator("div[class*='addr']").getByText(/@/).last().textContent()
        }
        if(!newEmail)
            throw new Error("Could not read the newly-created InstAddr address")

        //Close any popup so it doesn't block later navigation clicks (only if a popup is actually open - else the button is missing)
        const closeBtn = instAddrPage.getByRole("button", {name: "Close"})
        if(await closeBtn.count() > 0)
            await closeBtn.first().click()

        return {instAddrContext, instAddrPage, email: newEmail.trim()}
    }

    //The InstAddr Inbox is one shared mailbox across every temp address ever created on the account, listing all mail
    //newest-first, so the "first" row is NOT reliably the confirmation mail for the address we just created - it can
    //just as easily be an older marketing email, or mail for an address a different/concurrent test run is using,
    //depending on exactly when each message was delivered relative to this call. This polls (via the Reload icon) until
    //a row addressed to expectedEmail actually shows up, then returns a locator scoped to that specific row.
    async function WaitForInstAddrMail(instAddrPage, expectedEmail, timeoutMs = 60 * 1000, existingMailIds = [])
    {
        const mailRows = instAddrPage.locator("a[id*='link_maildata']").filter({hasText: expectedEmail})
        const seenIds = new Set(existingMailIds)
        const deadline = Date.now() + timeoutMs

        while (true)
        {
            for(let i = 0; i < await mailRows.count(); i++)
            {
                const mailRow = mailRows.nth(i)
                if(!seenIds.has(await mailRow.getAttribute("id")))
                    return mailRow
            }

            if (Date.now() > deadline)
            {
                throw new Error(`Timed out after ${timeoutMs}ms waiting for a new mail addressed to ${expectedEmail} to arrive in InstAddr`)
            }

            await instAddrPage.locator("#image_reload").click()
            await instAddrPage.waitForTimeout(3 * 1000)
        }
    }

    //A newly registered account already has a confirmation email in its inbox. Record that row before requesting a
    //password-reset email so the next lookup cannot reopen the registration link instead of the new reset link.
    async function ExistingInstAddrMailIds(instAddrPage, email)
    {
        await instAddrPage.goto("https://m.kuku.lu/recv.php")
        const mailRows = instAddrPage.locator("a[id*='link_maildata']").filter({hasText: email})
        await mailRows.first().waitFor()
        return mailRows.evaluateAll(rows => rows.map(row => row.id))
    }

    //The birth date fields (#birth-year/#birth-month/#birth-day) render as real <select> elements but are kept
    //display:none in favor of a custom-styled dropdown widget, so Playwright's selectOption() times out waiting for them
    //to become visible. Drive the custom widget instead: click its trigger to open the dropdown, then click the option
    //matching the native <select>'s value (the widget mirrors the selection back into the hidden native select).
    async function SelectCustomBirthDropdown(arg_page, dataId, value)
    {
        const container = arg_page.locator(`div.custom-select--birth[data-id='${dataId}']`)
        await container.locator("div.select-selected").click()
        const option = container.locator(`div.select-option[data-value='${value}']`)
        if(await option.count() === 0)
        {
            const choices = await container.locator("div.select-option").evaluateAll(elements =>
                elements.map(el => ({value: el.getAttribute("data-value"), text: el.textContent?.trim()})))
            throw new Error(`Birth ${dataId} option ${value} not found; available options: ${JSON.stringify(choices.slice(0, 20))}`)
        }
        await expect(option).toBeVisible({timeout: 15 * 1000})
        await option.click()
    }

    //Registers a brand-new member account for the Change Email / Change Password tests, since those operations are
    //destructive and must never run against the shared fixture account. Generates a fresh, never-used InstAddr temp
    //email, runs the full Pure Membership Registration flow, and returns everything the caller needs: the account's
    //own context/page (left logged in on Tokyu Stay), the temp email + password it was created with, and the InstAddr
    //context/page (left logged in) so the inbox can be reused afterwards.
    //NOTE: this mirrors the standalone "Pure Membership Registration" test below; keep the two in sync.
    async function RegisterNewMemberAccount(browser)
    {
        const {instAddrContext, instAddrPage, email: memberRegEmail} = await CreateInstAddrTempEmail(browser)

        const accountContext = await browser.newContext()
        const accountPage = await accountContext.newPage()

        await accountPage.goto("https://stg.reservation.tokyustay.co.jp/en");
        await expect(accountPage).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');

        //The register link now routes to the SmartClub "Enter basic information" form (the membership wizard moved there).
        await accountPage.locator("a[href*='mypage/register']").click()
        await expect(accountPage).toHaveURL(/mypage\/register/)

        await accountPage.waitForTimeout(3*1000)
        await accountPage.locator("button.p-header__translate__button").click()
        await accountPage.locator(".p-header__translate__lang").filter({ hasText: "English" }).click()

        await accountPage.locator("input[name='email']").fill(memberRegEmail)
        await accountPage.locator("input[name='password']").fill(info.memberReg_Password)
        await accountPage.locator("input[name='password_confirm']").fill(info.memberReg_Password)
        await accountPage.locator("input[name='last_name']").fill(info.memberReg_LastName)
        await accountPage.locator("input[name='first_name']").fill(info.memberReg_FirstName)
        await accountPage.locator("input[placeholder='ヤマダ']").fill(info.memberReg_LastName_Kana)
        await accountPage.locator("input[placeholder='タロウ']").fill(info.memberReg_FirstName_Kana)

        await accountPage.locator("label[for='terms_0']").click()
        await accountPage.locator("label[for='terms_1']").click()

        await accountPage.getByRole("button", {name: "Submit"}).click()

        //ASSERTION: registration advances off the entry form (to either a step-2 page or the "confirmation sent" page).
        //If the staging backend rejects the registration, SmartClub stays on /mypage/register with a generic error alert
        //(latest staging state) - this is an environment block, not a selector issue. Fail fast with a clear message.
        try
        {
            await expect(accountPage).not.toHaveURL(/mypage\/register$/, {timeout: 30000})
        }
        catch(e)
        {
            throw new Error("New-member registration could not be completed on staging (SmartClub stayed on /mypage/register - server likely rejected the submission). Both Change tests need a fresh account, so this is currently an env block.")
        }

        //Complete the registration from the confirmation email (same InstAddr gateway pattern as the standalone test)
        await instAddrPage.goto("https://m.kuku.lu/recv.php")//Open the Inbox directly (the old mobile `.mastermenuicon` menu toggle is gone from the current layout)
        const mailRow = await WaitForInstAddrMail(instAddrPage, memberRegEmail, 90 * 1000)
        await mailRow.click()

        const frame = instAddrPage.frameLocator('iframe[name^="area_maildata_iframe_"]')
        const [confirmPage] = await Promise.all
        ([
            instAddrContext.waitForEvent("page"),
            frame.locator("a[href*='exwa.org']").first().click()
        ])

        await expect(confirmPage.locator("div.register-gridList__data").nth(0)).toContainText(memberRegEmail)
        await expect(confirmPage.locator("div.register-gridList__data").nth(2)).toContainText(info.memberReg_LastName)
        await expect(confirmPage.locator("div.register-gridList__data").nth(2)).toContainText(info.memberReg_FirstName)

        await SelectCustomBirthDropdown(confirmPage, "birth-year", "1923")
        await SelectCustomBirthDropdown(confirmPage, "birth-month", "7")
        await SelectCustomBirthDropdown(confirmPage, "birth-day", "23")
        await confirmPage.locator("label[for='gender-other']").click()
        await confirmPage.locator("#postal_code").fill(info.memberReg_Zipcode)
        await confirmPage.locator("#prefecture_or_state").fill(info.memberReg_State)
        await confirmPage.locator("#street_address").fill(info.memberReg_City)
        await confirmPage.locator("#building_name_and_number").fill(info.memberReg_Address)
        await confirmPage.locator("#phone").fill(info.memberReg_PhoneNumber)
        await confirmPage.locator("label[for='off_email_newsletter_status']").click()
        await confirmPage.locator("button.c-button").click()

        await confirmPage.locator("a.c-button__2").click()//Edit button
        await confirmPage.locator("button.c-button").click()
        await confirmPage.locator("button.c-button__1").click()//Save button
        await expect(confirmPage.locator("span.eng-text-register__mail").locator("xpath=..")).toContainText("Registration completed")

        await confirmPage.locator("a.c-button").click()//Service button
        await expect(confirmPage).toHaveURL("https://stg.reservation.tokyustay.co.jp/en")
        await confirmPage.close()

        //The registration browser page is not authenticated after email confirmation. Log in before returning it to callers.
        await accountPage.goto("https://stg.reservation.tokyustay.co.jp/en")
        await accountPage.getByRole("button", {name: "Log In"}).click()
        await expect(accountPage).toHaveURL(/mypage\/login/)
        await accountPage.locator("input[name='email']").fill(memberRegEmail)
        await accountPage.locator("input[name='password']").fill(info.memberReg_Password)
        await accountPage.locator("button.c-button").click()
        await accountPage.waitForURL(url => url.href.includes("/mypage/agreement") || url.href === "https://stg.reservation.tokyustay.co.jp/en")
        await AgreeToTermsRevisionIfPresent(accountPage)
        await accountPage.locator("div.space-x-2").waitFor()

        return {accountContext, accountPage, instAddrContext, instAddrPage, email: memberRegEmail, password: info.memberReg_Password}
    }

    //Creates one more brand-new InstAddr address (in addition to the registration email) on an already-logged-in
    //InstAddr page, returning the new address. Used by Change Email Address to have a second, never-used inbox.
    async function CreateAnotherInstAddrEmail(instAddrPage)
    {
        //The inbox does not render the address-creation link; it lives on the Addresses page.
        await instAddrPage.goto("https://m.kuku.lu/en.php")
        const createAddressLink = instAddrPage.getByRole("link", {name: "Create an address automatically"})
        await expect(createAddressLink).toBeVisible({timeout: 30 * 1000})
        await createAddressLink.click()

        const eulaDialog = instAddrPage.getByRole("dialog").filter({hasText: "Terms of Use (EULA)"})
        if(await eulaDialog.count() > 0)
        {
            await instAddrPage.getByText("Yes", {exact: true}).last().click()
            await instAddrPage.waitForTimeout(1 * 1000)
        }

        await DismissRecaptchaCheckboxIfPresent(instAddrPage)
        const addressIpup = instAddrPage.locator("div.noticebox, [class*='dialog']").filter({hasText: /@/}).last()
        const popupText = await addressIpup.textContent()
        const match = (popupText || "").match(/[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
        const newEmail = match ? match[0] : null
        if(!newEmail)
            throw new Error("Could not read the newly-created InstAddr address")

        const closeBtn = instAddrPage.getByRole("button", {name: "Close"})
        if(await closeBtn.count() > 0)
            await closeBtn.first().click()

        //The next step polls incoming mail; the Addresses page has no mail rows.
        await instAddrPage.goto("https://m.kuku.lu/recv.php")
        return newEmail.trim()
    }

    return {
        GenerateFreshPassword,
        AgreeToTermsRevisionIfPresent,
        Login,
        ClearAmenityFilters,
        ClickFirstBookableNonResalePlan,
        ProceedThroughPaymentGateway,
        CreateInstAddrTempEmail,
        WaitForInstAddrMail,
        ExistingInstAddrMailIds,
        SelectCustomBirthDropdown,
        RegisterNewMemberAccount,
        CreateAnotherInstAddrEmail,
    }
}

module.exports = {FormatCalendarDate, createTokyuHelpers}
