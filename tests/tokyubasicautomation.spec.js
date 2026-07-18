const {test, expect} = require('@playwright/test') //Module
//const { text } = require('stream/consumers')
const path = require('path');

//CSS Selectors Guide
/*

1. If id is present
tagname.id or #id

2. If class attribute is rpesent
tagname.class
.class

3. Write css based on any attribute
[attribute='value']
tagname[attribute='value']

4. Traversing from parent CSS to child CSS
parentcss [whitespace] childcss
parenttag [whitespace] childtag

5. Writing css based on text in the DOM
text=''

*/


test.afterEach(async ({ page }, testInfo) => {
  const fileName = testInfo.title.replace(/\s+/g, '_');

  const screenshotPath = path.join(
    'test-results',
    `${fileName}.png`
  );

  // Capture screenshot for ALL tests (pass + fail)
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Attach it to Playwright report
  await testInfo.attach('screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  });
});


//Object
const info =
{
    //fixedEmail:"nathan.sativelthamilvanan+webcc1@jitera.com", //For Reservation History later
    fixedEmail:"nathan.sativelthamilvanan+payerrortest1@jitera.com",
    fixedPassword:"Newpassword1",

    //MEMBERSHIP REGISTRATION
    memberReg_Email:"budsumlet@kywa.uk", //Each time "Member Registration" test case is run, update this string (must be a fresh, never-registered address)
    memberReg_Password:"Newpassword1",
    memberReg_FirstName:"Sativel",
    memberReg_LastName:"Nathan",
    memberReg_FirstName_Kana:"ア",
    memberReg_LastName_Kana:"エ",
    memberReg_Country:"Japan",
    memberReg_Zipcode:"1234567",
    memberReg_State:"State",
    memberReg_City:"City",
    memberReg_Address:"Address",
    memberReg_PhoneNumber:"+1234567890",

    //EDIT PROFILE
    editProfile_FirstName:"Sativel",
    editProfile_LastName:"Nathan",
    editProfile_FirstName_Kana:"ア",
    editProfile_LastName_Kana:"エ",
    editProfile_Country:"Germany",
    editProfile_Zipcode:"444444444",
    editProfile_State:"State4",
    editProfile_City:"City4",
    editProfile_Address:"Address4",
    editProfile_PhoneNumber:"+4444444444",
    editProfile_Birthday_YearRange:"1941 – 1950", // <-- Uses an EN DASH, not a normal hyphen. Code fails if use normal hyphen
    editProfile_Birthday_Year:"1943",
    editProfile_Birthday_Month:"June",
    editProfile_Birthday_Day:"24",
    editProfile_Gender:"Female",

    //RESET PASSWORD
    resetPW_Email:"kithayfig@otona.uk",
    resetPW_Password:"Newpassword30", //Each time "Reset Password" test case is run, update this string

    //INSTADDR DUMMY MAILBOX
    instAddrAccountID:"411715231887",
    instAddrPassword:"BU1iapx42ol:Y5Dk",

    //CREATE, EDIT, CANCEL RESERVATION
    hotelBranch: "Tokyu Stay Ginza(staging)",
    checkInDate: "July 29, 2026", //Must be a future date relative to when the test is run, or the calendar day will be disabled
    checkOutDate: "July 30, 2026", //Must be a future date relative to when the test is run, or the calendar day will be disabled
    arrivalTime: "22:00"
}


//Helper Functions
async function Login(arg_page) 
{   
    await arg_page.goto("https://stg.reservation.tokyustay.co.jp/en");
    await expect(arg_page).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');
    await arg_page.getByRole("button", {name: "Log In"}).click()

    await expect(arg_page).toHaveURL("https://test-smartclub.metroengines.jp/mypage/login")
    await arg_page.locator("input[name='email']").fill(info.fixedEmail)
    await arg_page.locator("input[name='password']").fill(info.fixedPassword)
    await arg_page.locator("button.c-button").click()
    await arg_page.locator("div.space-x-2").waitFor()
    const pointVisible = await arg_page.locator("div.space-x-2").isVisible()
    expect(pointVisible).toBeTruthy()

    return arg_page
}

//Tests

//STATUS: OK
test('Tokyu Stay - Login', async ({page})=>
{
    await Login(page)
});


//STATUS: OK
test('Tokyu Stay - Logout', async({page})=>
{
    const returnedPage = await Login(page)

    await returnedPage.locator("div div a.items-center").nth(2).click()//Click Account name
    await returnedPage.getByRole("listitem").last().click()//Click Logout in the side list
    await returnedPage.getByRole("button", {name: "Close Modal"}).click()
    await returnedPage.getByRole("listitem").last().click()
    await returnedPage.locator(".space-x-4").getByRole("button", {name: "LOG OUT"}).click()

    await returnedPage.getByRole("button", {name: "Log In"}).waitFor()
    const loginBtnVisible = await returnedPage.getByRole("button", {name: "Log In"}).isVisible()
    await expect(loginBtnVisible).toBeTruthy()

    //await returnedPage.pause()


});


//STATUS: OK
//PRECONDITIONS: Update the email to use for Member Reg in const objects before running test
//NOTES: Some refactoring required for the InstAddr page related code & add some additional assertion in the "SmartClub Confirm Details" page (the one with the edit button)
test('Tokyu Stay - Pure Membership Registration', async ({browser,page})=>
{
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    await page1.goto("https://stg.reservation.tokyustay.co.jp/en");
    await expect(page1).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');

    await page1.locator("a[href*='mypage/register']").click()
    
    //Ensure SmartClub page language is English (site no longer defaults to Japanese, so select explicitly instead of assuming position)
    await page1.waitForTimeout(3*1000) //Wait for 1.5 seconds to ensure everything loads (Cause there is a split second where the page changes for a bit)
    await page1.locator("button.p-header__translate__button").click()
    await page1.locator(".p-header__translate__lang").filter({ hasText: "English" }).click()

    await page1.locator("input[name='email']").fill(info.memberReg_Email)
    await page1.locator("input[name='password']").fill(info.memberReg_Password)
    await page1.locator("input[name='password_confirm']").fill(info.memberReg_Password)
    await page1.locator("input[name='last_name']").fill(info.memberReg_LastName)
    await page1.locator("input[name='first_name']").fill(info.memberReg_FirstName)

    if(info.memberReg_Country != "Japan")
    {
        await page1.locator("div.select-selected").click()
        await page1.getByText(info.memberReg_Country).click()
        
    }
    else
    {
        await page1.locator("input[name='last_name_kana']").fill(info.memberReg_LastName_Kana)
        await page1.locator("input[name='first_name_kana']").fill(info.memberReg_FirstName_Kana)
    }

    await page1.locator("label[for='terms_0']").click()//Click the 1st term of agreement
    await page1.locator("label[for='terms_1']").click()//Click the 2nd term of agreement

    await page1.locator("button.c-button").click()

    //ASSERTION: Check if the user is at the Confirmation Email sent page
    //NOTE: the "sent"/last word of this text renders as a sibling text node outside .eng-text-register__mail, so assert on the parent instead of an exact match on the span itself
    await expect(page1.locator(".eng-text-register__mail").locator("xpath=..")).toContainText("Confirmation email has been sent")

    //PAGE 2
    const instAddrContext = await browser.newContext()
    const instAddrPage = await instAddrContext.newPage()
    await instAddrPage.goto("https://m.kuku.lu/en.php")

    await instAddrPage.locator(".mastermenuicon").first().click()//Config
    await instAddrPage.locator("a[href*='pagemode_login']").click()//Account
    await instAddrPage.locator("#link_loginform").click()
    await instAddrPage.getByPlaceholder("AccountID").fill(info.instAddrAccountID)
    await instAddrPage.locator("#user_password").fill(info.instAddrPassword)
    await instAddrPage.locator("a[href*='checkLogin()']").click()
    await instAddrPage.locator("#area-confirm-dialog-button-ok").click()

    await instAddrPage.locator(".mastermenuicon").nth(2).click()
    await instAddrPage.locator("a[id*='link_maildata']").first().click()

    const frame = instAddrPage.frameLocator('iframe[name^="area_maildata_iframe_"]')
    const [page3] = await Promise.all
    ([
        instAddrContext.waitForEvent("page"),//The "heads-up" to look out for the new window
        frame.locator("a[href*='exwa.org']").first().click()//The action that opens the new window (mail gateway domain now uses "gatewayN.exwa.org", not "gateway.exwa.org")
    ])

    //PAGE 3
    await expect(page3.locator("div.register-gridList__data").nth(0)).toContainText(info.memberReg_Email)
    await expect(page3.locator("div.register-gridList__data").nth(1)).toContainText(info.memberReg_Country)
    await expect(page3.locator("div.register-gridList__data").nth(2)).toContainText(info.memberReg_LastName)
    await expect(page3.locator("div.register-gridList__data").nth(2)).toContainText(info.memberReg_FirstName)
    await expect(page3.locator("div.register-gridList__data").nth(3)).toContainText(info.memberReg_LastName_Kana)
    await expect(page3.locator("div.register-gridList__data").nth(3)).toContainText(info.memberReg_FirstName_Kana)

    await page3.locator("#birth-year").selectOption("1923")
    await page3.locator("#birth-month").selectOption("7")
    await page3.locator("#birth-day").selectOption("23")
    await page3.locator("label[for='gender-other']").click()
    await page3.locator("#postal_code").fill(info.memberReg_Zipcode)
    await page3.locator("#prefecture_or_state").fill(info.memberReg_State)
    await page3.locator("#street_address").fill(info.memberReg_City)
    await page3.locator("#building_name_and_number").fill(info.memberReg_Address)
    await page3.locator("#phone").fill(info.memberReg_PhoneNumber)
    await page3.locator("button.c-button").click()

    await page3.locator("a.c-button__2").click()//Edit button
    await page3.locator("button.c-button").click()
    await page3.locator("button.c-button__1").click()//Save button

    await expect(page3.locator("span.eng-text-register__mail").locator("xpath=..")).toContainText("Registration completed.")

    await page3.locator("a.c-button").click()//Click "Service button"

    await expect(page3).toHaveURL("https://stg.reservation.tokyustay.co.jp/en")

    //await page3.pause()

});

//STATUS: OK
//PRECONDITIONS: Update the password to use for Reset Password in const objects before running test
//Some refactoring required for the InstAddr page rlated code
test('Tokyu Stay - Reset Password', async({browser, page})=>
{
    //PAGE 1
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto("https://stg.reservation.tokyustay.co.jp/en");
    await expect(page1).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');
    await page1.getByRole("button", {name: "Log In"}).click()
    await expect(page1).toHaveURL("https://test-smartclub.metroengines.jp/mypage/login")

    await page1.locator("a[href*='password/reset']").click()
    await expect(page1).toHaveURL("https://test-smartclub.metroengines.jp/mypage/password/reset")
    await page1.waitForTimeout(2*1000) //Wait for 1.5 seconds to ensure everything loads (Cause there is a split second where the page changes for a bit)

    //Ensure SmartClub page1 language is English (site no longer defaults to Japanese, so select explicitly instead of assuming position)
    const btn = page1.locator("button.p-header__translate__button:visible")
    await expect(btn).toBeEnabled();     // ensures hydration done
    await expect(btn).toBeInViewport();  // ensures no overlays
    await btn.click();
    await page1.locator(".p-header__translate__lang").filter({ hasText: "English" }).click()


    await page1.getByPlaceholder("例）user@smartclub.tokyu-rs.co.jp").fill(info.resetPW_Email)
    await page1.getByRole("button", {name: /Send email/}).click()
    await expect(page1).toHaveURL("https://test-smartclub.metroengines.jp/mypage/password/send/mail")
    
    //Open InstAddr to check mail
    const instAddrContext = await browser.newContext()
    const instAddrPage = await instAddrContext.newPage()
    await instAddrPage.goto("https://m.kuku.lu/en.php")

    await instAddrPage.locator(".mastermenuicon").first().click()//Config
    await instAddrPage.locator("a[href*='pagemode_login']").click()//Account
    await instAddrPage.locator("#link_loginform").click()
    await instAddrPage.getByPlaceholder("AccountID").fill(info.instAddrAccountID)
    await instAddrPage.locator("#user_password").fill(info.instAddrPassword)
    await instAddrPage.locator("a[href*='checkLogin()']").click()
    await instAddrPage.locator("#area-confirm-dialog-button-ok").click()

    await instAddrPage.locator(".mastermenuicon").nth(2).click()
    await instAddrPage.locator("a[id*='link_maildata']").first().click()

    const frame = instAddrPage.frameLocator('iframe[name^="area_maildata_iframe_"]')
    const [page2] = await Promise.all
    ([
        instAddrContext.waitForEvent("page"),//The "heads-up" to look out for the new window
        frame.locator("a[href*='exwa.org']").first().click()//The action that opens the new window (mail gateway domain now uses "gatewayN.exwa.org", not "gateway.exwa.org")
    ])

    //PAGE 2
    //Ensure SmartClub page language is English (site no longer defaults to Japanese, so select explicitly instead of assuming position)
    await page1.waitForTimeout(4*1000) //Wait for 1.5 seconds to ensure everything loads (Cause there is a split second where the page changes for a bit)
    const btn2 = page2.locator("button.p-header__translate__button");
    await expect(btn2).toBeEnabled();     // ensures hydration done
    await expect(btn2).toBeInViewport();  // ensures no overlays
    await btn2.click();
    await page2.locator(".p-header__translate__lang").filter({ hasText: "English" }).click()

    await page2.getByPlaceholder("新しいパスワード / New password").fill(info.resetPW_Password)
    await page2.getByPlaceholder("確認用に再入力 / Re-enter for confirmation").fill(info.resetPW_Password)
    await page2.getByRole("button", {name: /Reset password/}).click()
    await page1.waitForTimeout(4*1000)
    await expect(page2.locator("p.title")).toContainText("Your password has been changed.")

    //PAGE 3
    //Go back to STAY reservation site and login with the new password
    const context3 = await browser.newContext()
    const page3 = await context3.newPage()
    await page3.goto("https://stg.reservation.tokyustay.co.jp/en");
    await expect(page3).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');
    await page3.getByRole("button", {name: "Log In"}).click()
    await expect(page3).toHaveURL("https://test-smartclub.metroengines.jp/mypage/login")

    await page3.getByPlaceholder("アカウント名を入力").fill(info.resetPW_Email)
    await page3.getByPlaceholder("パスワードを入力").fill(info.resetPW_Password)
    await page3.locator("button.c-button").click()
    await page3.locator("div.space-x-2").waitFor()
    const pointVisible = await page3.locator("div.space-x-2").isVisible()
    await expect(pointVisible).toBeTruthy()

    //await page3.pause()

});         


//STATUS: OK
//PRECONDITIONS: Update the inputs for the fields to be edited in const objects, as well as the checkin/out date
//Some refactoring could be done to streamline the code, otherwise it covers the requirements
test('Tokyu Stay - Edit Profile', async({page})=>
{
    const page1 = await Login(page)

    await page1.locator("a[href*='my-page/profile']").click()
    await page1.getByRole("listitem").locator("a[href*='my-page/profile']").last().click()


    await page1.locator("input[name='first_name']").first().fill(info.editProfile_FirstName)
    await page1.locator("input[name='last_name']").first().fill(info.editProfile_LastName)
    await page1.locator("input[name='phone']").first().fill(info.editProfile_PhoneNumber)
    await page1.locator("div.flex-1").first().click()
    
    await page1.locator("button.react-calendar__navigation__label").click({ clickCount: 3 });//Clicks the same calendar button 3 times, so no need to repeat the line multiple times
    await page1.locator("button.react-calendar__tile").filter({ hasText: info.editProfile_Birthday_YearRange }).click() 
    await page1.locator("button.react-calendar__tile").filter({ hasText: info.editProfile_Birthday_Year }).click()
    await page1.locator("button.react-calendar__tile").filter({ hasText: info.editProfile_Birthday_Month }).click()
    await page1.locator("button.react-calendar__tile").filter({ hasText: info.editProfile_Birthday_Day }).click()

    await page1.locator("button[name='gender']").first().click()
    await page1.getByRole("option", {name: info.editProfile_Gender }).click()
    await page1.locator("input[name='address']").first().fill(info.editProfile_Address)
    await page1.locator("input[name='prefecture_or_state']").first().fill(info.editProfile_State)
    await page1.locator("input[name='city']").first().fill(info.editProfile_City)

    if(await page1.locator("div.relative button[aria-haspopup*='listbox']").nth(1).textContent() == "Japan")
    {
        //If Country is Japan, update Kana & Zipcode fields, save changes and assert if changes saved, change language to non-Japan, click "Save Changes" to assert the error message for Zipcode and Kana fields
        await page1.locator("input[name='postal_code']").first().fill(info.editProfile_Zipcode)//Edit Zipcode
        await page1.locator("input[name='first_name_kana']").first().fill(info.editProfile_FirstName_Kana)
        await page1.locator("input[name='last_name_kana']").first().fill(info.editProfile_LastName_Kana)

        await page1.getByRole("button", {name: "Save Changes"}).click()
        await expect(await page1.getByText('Your profile was updated successfully', { exact: true })).toContainText("Your profile was updated successfully")

        await page1.locator("div.relative button[aria-haspopup*='listbox']").nth(1).click()//This is PC Web specific locator, it is slightly different for Mobile Web. During runtime the attribute changes to r9, not sure why
        await page1.getByRole("option", {name: info.editProfile_Country}).click()

        await page1.locator("div.relative button[aria-haspopup*='listbox']").nth(1).click()//This is PC Web specific locator, it is slightly different for Mobile Web. During runtime the attribute changes to r9, not sure why
        await page1.getByRole("option", {name: "Japan"}).click()
        await page1.getByRole("button", {name: "Save Changes"}).click()

        //ASSERTION: Check if the error message appears correctly for Kana and Zipcode fields
        const allErrors = page1.locator("form div p.text-error");
        const errorCount = await allErrors.count();

        for(let i = 0; i < errorCount; i++)
        {
            let textError = await page1.locator("form div p.text-error").nth(i).textContent()
        
            if(textError.includes("Katakana"))
                expect(await page1.locator("form div p.text-error").nth(i)).toContainText("Please enter in Katakana")
            else if(textError.includes("ZIP"))
                expect(await page1.locator("form div p.text-error").nth(i)).toContainText("Please input ZIP Code")

        }


    }
    else
    {
        //If country is not Japan. change the language to Japan, fill in Kana, Zipcode fields and then save changes
        await page1.locator("div.relative button[aria-haspopup*='listbox']").nth(1).click()//This is PC Web specific locator, it is slightly different for Mobile Web. During runtime the attribute changes to r9, not sure why
        await page1.getByRole("option", {name: "Japan"}).click()

        await page1.locator("input[name='postal_code']").first().fill(info.editProfile_Zipcode)//Edit Zipcode
        await page1.locator("input[name='first_name_kana']").first().fill(info.editProfile_FirstName_Kana)
        await page1.locator("input[name='last_name_kana']").first().fill(info.editProfile_LastName_Kana)

        await page1.getByRole("button", {name: "Save Changes"}).click()
        await expect(await page1.getByText('Your profile was updated successfully', { exact: true })).toContainText("Your profile was updated successfully")
    }
    
    await page1.getByText("Homepage").click()//Return to Homepage

    //Search for a reservation and proceed to the Payment page
    await page1.locator(".relative.bg-white").last().click()
    await page1.getByText(info.hotelBranch).click()
    await page1.locator(".text-lg").first().click()
    //NOTE: the calendar renders two adjacent month grids, and the second grid's leading/trailing "neighboring month" cells can duplicate a date shown in the first grid, so use .first() to disambiguate
    await page1.locator("abbr[aria-label*='" + info.checkInDate + "']").first().click()
    await page1.locator("abbr[aria-label*='" + info.checkOutDate + "']").first().click()
    await page1.locator("button.w-full").nth(2).click()
    await page1.locator("svg[stroke*='A7A7A7']").nth(1).click()
    await page1.getByRole("button", {name: "Confirm"}).click()
    await page1.getByRole("button", {name: "Search"}).click()
    //ASSERTION: the "Available Plans" heading no longer exists in the current UI; assert on a bookable result appearing instead
    await expect(page1.getByRole("button", {name: "Book now"}).first()).toBeVisible()
    await page1.locator("#search-result-group-19190639").getByRole("button", {name: "Book now"}).nth(1).click()

    await page1.waitForTimeout(4*1000)
    await page1.getByRole("button", {name: "Select one"}).click()//Open the "Select Arrival Time" dropdown
    await page1.getByRole("option", {name: info.arrivalTime}).click()//Select a time slot in the dropdown

    //ASSERTION: Check if the values in the fields match the same values as in Edit Profile
    await expect(page1.locator("input[name='firstName']")).toHaveValue(info.editProfile_FirstName)
    await expect(await page1.locator("input[name='lastName']")).toHaveValue(info.editProfile_LastName)
    await expect(await page1.locator("input[name='lastNameKana']")).toHaveValue(info.editProfile_LastName_Kana)
    await expect(await page1.locator("input[name='firstNameKana']")).toHaveValue(info.editProfile_FirstName_Kana)
    await expect(await page1.locator("input[name='phoneNumber']")).toHaveValue(info.editProfile_PhoneNumber)
    await expect(await page1.locator("input[name='email']")).toHaveValue(info.fixedEmail)
    await expect(await page1.locator("input[name='zipCode']")).toHaveValue(info.editProfile_Zipcode)
    await expect(await page1.locator("input[name='address']")).toHaveValue(info.editProfile_Address)
    await expect(await page1.locator("input[name='state']")).toHaveValue(info.editProfile_State)
    await expect(await page1.locator("input[name='city']")).toHaveValue(info.editProfile_City)
    await expect(await page1.locator("#country")).toContainText("Japan")
    await expect(await page1.locator("input[name='roomGuests.0.firstName']")).toHaveValue(info.editProfile_FirstName)
    await expect(await page1.locator("input[name='roomGuests.0.lastName']")).toHaveValue(info.editProfile_LastName)
    await expect(await page1.locator("input[name='roomGuests.0.lastNameKana']")).toHaveValue(info.editProfile_LastName_Kana)
    await expect(await page1.locator("input[name='roomGuests.0.firstNameKana']")).toHaveValue(info.editProfile_FirstName_Kana)

    await page1.locator("div.relative button[aria-haspopup*='listbox']").nth(1).click()
    await page1.getByRole("option", {name: info.editProfile_Country}).click()
    await page1.locator("div.relative button[aria-haspopup*='listbox']").nth(1).click()
    await page1.getByRole("option", {name: "Japan"}).click()

    await page1.locator("#on_site").click()
    await page1.getByRole("button", {name: "Confirm"}).click()

    //ASSERTION: Check if the error message appears correctly for Kana and Zipcode fields in Reservation Payment page
    const allErrorsPaymentPage = page1.locator("form div p.text-error");
    const errorCountPaymentPage = await allErrorsPaymentPage.count();

    for(let i = 0; i < errorCountPaymentPage; i++)
    {
        let textErrorPaymentPage = await page1.locator("form div p.text-error").nth(i).textContent()
        
        if(textErrorPaymentPage.includes("Katakana"))
            expect(await page1.locator("form div p.text-error").nth(i)).toContainText("Please enter in Katakana")
        else if(textErrorPaymentPage.includes("ZIP"))
            expect(await page1.locator("form div p.text-error").nth(i)).toContainText("Please input a valid ZIP Code")

    }

    //await page1.pause()

    
});

//STATUS: OK
test('Tokyu Stay - Point Information', async({page})=>
{
    const arr_memberRanks = ["Regular Member", "Gold Member", "Platinum Member"]
    const returnedPage = await Login(page)

    await returnedPage.locator("a[href*='my-page/point-information']").click()//Click Account name
    //await returnedPage.getByRole("listitem").locator("a[href*='point-information']").click()

    //ASSERTION: Check if the user's Membership Status is displayed as either Regular, Gold or Platinum Member
    for(let i = 0; i < arr_memberRanks.count; i++)
    {
        await expect(returnedPage.locator(".text-primary-dark").nth(0)).toHaveText(arr_memberRanks[i])
    }

    //ASSERTION: Check if Points value is more or equal to 0 in Stay site
    const pointStringStay = await returnedPage.locator(".text-primary-dark").nth(1).textContent()
    expect(parseInt(pointStringStay)).toBeGreaterThanOrEqual(0)

    //Click "Link to My Page" button and wait until Points Available is loaded into DOM
    await returnedPage.getByRole("button", {name: "Link to MY PAGE"}).click()
    await returnedPage.locator("#total_point").waitFor()

    //ASSERTION: Check if Points value is more or equal to 0 in SmartClub site
    const pointStringSmartClub = await returnedPage.locator("#total_point").textContent()
    expect(parseInt(pointStringSmartClub)).toBeGreaterThanOrEqual(0)

    //await returnedPage.pause()
});

//STATUS: OK
//PRECONDITIONS: Update the Check-In/Checkout dates before running this script
test('Tokyu Stay - Logged In Reservation', async({page})=>
{
    const page1 = await Login(page)

    await page1.locator(".relative.bg-white").last().click()
    await page1.getByText(info.hotelBranch).click()
    await page1.locator(".text-lg").first().click()
    //NOTE: the calendar renders two adjacent month grids, and the second grid's leading/trailing "neighboring month" cells can duplicate a date shown in the first grid, so use .first() to disambiguate
    await page1.locator("abbr[aria-label*='" + info.checkInDate + "']").first().click()
    await page1.locator("abbr[aria-label*='" + info.checkOutDate + "']").first().click()
    await page1.locator("button.w-full").nth(2).click()
    await page1.locator("svg[xmlns*='w3.org']").nth(4).click()
    await page1.getByRole("button", {name: "Confirm"}).click()
    await page1.getByRole("button", {name: "Search"}).click()

    //ASSERTION: the "Available Plans" heading no longer exists in the current UI; assert on a bookable result appearing instead
    await expect(page1.getByRole("button", {name: "Book now"}).first()).toBeVisible()
    //NOTE: an unscoped global index into "Book now" buttons is fragile (the resale-plan section adds extra buttons, and sold-out rooms render disabled ones), so scope to a specific, stable plan group like the Edit Profile test does
    await page1.locator("#search-result-group-19190639").getByRole("button", {name: "Book now"}).nth(1).click()

    //ASSERTION: Check if this is a Logged-In Reservation by seeing if Points To Be Earned is > 0, because only logged in reservation gives points
    //The reason the assertion is written like this is because even after the DOMcontent is loaded, the points to be earned is still shown as 0
    //Only after the .js script is executed then only the correct Points to Be Earned value is shown
    //So this code keeps running the assertion multiple times until the Points to Be Earned text is NOT 0pt
    await expect(page1.locator("div.text-sm.text-right").locator(".font-bold").last()).not.toHaveText("0pt")

    //You can add more assertions here to check if the value in each field is correct or not later on for the user details. 
    //For now we want to keep it straightforward so we'll just skip to payment processing

    await page1.getByRole("button", {name: "Select one"}).click()//Open the "Select Arrival Time" dropdown
    await page1.getByRole("option", {name: info.arrivalTime}).click()//Select a time slot in the dropdown
    await page1.locator("textarea.w-full").fill("This is a reservation created via Playwright Automation")//Fill in Remarks section

    await page1.locator("#credit_card").click() //Click the "Credit Card" radio button
    //await page1.locator('[name="cardBrand"]').last().click()//Open the Card Type dropdown <----- Andra implemented the new CC improvement, so need to change it
    //await page1.getByRole("option", {name: "JCB"}).click()//Click the specified card type
    await page1.locator('[name="cardName"]').fill("SATIVEL")//Fill in Cardholder Name
    await page1.locator('[name="cardNumber"]').pressSequentially("3528000000005006")//Fill in Card
    await page1.locator('[name="expiredDate"]').fill("0156")//Fill in Expiry Date
    await page1.getByPlaceholder("CVC").fill("012")//Fill in CVV
    await page1.locator("#isCardPolicyAgreed").click()//Click "Agree" checkbox for T&C
    await page1.locator('[name="couponCode"]').fill("D1000")//Enter Promo Code
    await page1.getByRole("button", {name: "Check"}).first().click()//Click CHECK button for Promo Code
    await page1.locator('[name="spendingPoint"]').fill("100")//Enter Points for discount
    await page1.getByRole("button", {name: "Check"}).last().click()//Click CHECK button for Points

    await expect(page1.locator("div.text-sm.text-right").nth(0)).not.toHaveText("0pt")//ASSERTION: Check if the Points discount is applied
    await expect(page1.locator("div.text-sm.text-right").nth(1)).not.toHaveText("¥ 0")//ASSERTION: Check if the Promo Code discount is applied

    await page1.getByRole("button", {name: "Confirm"}).click()//Click "Confirm" button to make booking

    //Make Playwright locate the button on the Payment Gateway modal and click it
    await page.locator('iframe').nth(0).contentFrame().getByRole('button', { name: '決済に進む' }).click();

    //ASSERTION: Check if the user has reached the Successfully Booked screen
    await page.waitForTimeout(3 * 1000)
    await expect(page1.locator("h1.text-secondary")).toHaveText("Successfully Booked")
    //await page1.pause()

});


///////////////////

//STATUS: OK
//PRECONDITIONS: Update the Check-In/Checkout dates before running this script
test('Tokyu Stay - Reservation History', async ({page})=>
{
    const page1 = await Login(page)

    //Create a logged-in reservation (mirrors the "Logged In Reservation" test)
    await page1.locator(".relative.bg-white").last().click()
    await page1.getByText(info.hotelBranch).click()
    await page1.locator(".text-lg").first().click()
    //NOTE: the calendar renders two adjacent month grids, and the second grid's leading/trailing "neighboring month" cells can duplicate a date shown in the first grid, so use .first() to disambiguate
    await page1.locator("abbr[aria-label*='" + info.checkInDate + "']").first().click()
    await page1.locator("abbr[aria-label*='" + info.checkOutDate + "']").first().click()
    await page1.locator("button.w-full").nth(2).click()
    await page1.locator("svg[xmlns*='w3.org']").nth(4).click()
    await page1.getByRole("button", {name: "Confirm"}).click()
    await page1.getByRole("button", {name: "Search"}).click()

    //ASSERTION: the "Available Plans" heading no longer exists in the current UI; assert on a bookable result appearing instead
    await expect(page1.getByRole("button", {name: "Book now"}).first()).toBeVisible()
    await page1.locator("#search-result-group-19190639").getByRole("button", {name: "Book now"}).nth(1).click()

    await page1.waitForTimeout(4*1000)
    await page1.getByRole("button", {name: "Select one"}).click()//Open the "Select Arrival Time" dropdown
    await page1.getByRole("option", {name: info.arrivalTime}).click()//Select a time slot in the dropdown
    await page1.locator("textarea.w-full").fill("This is a reservation created via Playwright Automation")//Fill in Remarks section

    await page1.locator("#credit_card").click() //Click the "Credit Card" radio button
    await page1.locator('[name="cardName"]').fill("SATIVEL")//Fill in Cardholder Name
    await page1.locator('[name="cardNumber"]').pressSequentially("3528000000005006")//Fill in Card (must use pressSequentially, .fill() triggers "Invalid Card Number" on this masked input)
    await page1.locator('[name="expiredDate"]').fill("0156")//Fill in Expiry Date
    await page1.getByPlaceholder("CVC").fill("012")//Fill in CVV
    await page1.locator("#isCardPolicyAgreed").click()//Click "Agree" checkbox for T&C
    await page1.getByRole("button", {name: "Confirm"}).click()//Click "Confirm" button to make booking

    //Make Playwright locate the button on the Payment Gateway modal and click it
    await page.locator('iframe').nth(0).contentFrame().getByRole('button', { name: '決済に進む' }).click();

    //ASSERTION: Check if the user has reached the Successfully Booked screen
    await page.waitForTimeout(3 * 1000)
    await expect(page1.locator("h1.text-secondary")).toHaveText("Successfully Booked")

    //Grab the reservation number from the success URL so we can find this exact booking among the account's other reservations
    const reservationNo = new URL(page1.url()).searchParams.get("reservationNo")
    expect(reservationNo).toBeTruthy()

    //GO TO BOOKINGS TAB
    await page1.locator("a[href*='my-page/profile']").click()
    await page1.getByRole("listitem").locator("a[href*='reservations']").click()
    await expect(page1.getByRole("heading", {name: "Bookings"})).toBeVisible()
    await page1.waitForLoadState("load")
    await page1.waitForTimeout(2*1000) //Wait for hydration so the accordion buttons' click handlers are attached before we click them

    //The account accumulates bookings across test runs, so the Upcoming list paginates (10 per page) and our new
    //booking may land on a later page. The reservation number only renders once a card is expanded, so on each page
    //expand every card (desktop layout only; the mobile layout duplicate stays hidden) and check for a match before
    //moving to the next page.
    let ourCard = page1.locator("div.w-full.bg-white.border-primary-light.border:visible").filter({hasText: reservationNo})
    for(let pageNum = 0; pageNum < 20 && await ourCard.count() === 0; pageNum++)
    {
        const cards = page1.locator("div.w-full.bg-white.border-primary-light.border:visible")
        const cardCount = await cards.count()
        for(let i = 0; i < cardCount; i++)
            await cards.nth(i).locator("button").first().click()

        ourCard = page1.locator("div.w-full.bg-white.border-primary-light.border:visible").filter({hasText: reservationNo})
        if(await ourCard.count() > 0)
            break

        const nextPageButton = page1.getByRole("button", {name: "Next"})
        if(!(await nextPageButton.isVisible()) || !(await nextPageButton.isEnabled()))
            break
        await nextPageButton.click()
        await page1.waitForTimeout(1*1000)
    }

    //ASSERTION: our newly created reservation was found (fails clearly instead of hanging if it wasn't on any page)
    await expect(ourCard).toHaveCount(1)
    await ourCard.getByRole("button", {name: "Details & QR"}).click()
    await page1.waitForLoadState("load")

    //NOTE: the page renders a hidden duplicate of this layout for the other breakpoint (desktop/mobile), so every locator below is scoped with :visible to avoid strict-mode violations

    //ASSERTION: User able to click the QR code and close it
    await page1.locator("a[href*='qrcode']:visible").click()
    await expect(page1.locator("canvas:visible")).toBeVisible()
    await page1.locator("a:visible", {hasText: "Close"}).click()
    await expect(page1.getByRole("heading", {name: "Reservation Details"}).first()).toBeVisible()

    //ASSERTION: User able to view the Map (opens in a new tab)
    const [mapPage] = await Promise.all(
    [
        page1.context().waitForEvent("page"),
        page1.locator("a:visible", {hasText: "View map"}).click()
    ])
    await mapPage.waitForLoadState()
    expect(mapPage.url()).toContain("google.com/maps")
    await mapPage.close()

    //ASSERTION: User is able to cycle through all the images in the carousel
    const thumbnailRow = page1.locator("div.flex.cursor-default.space-x-4:visible").first()
    const thumbnails = thumbnailRow.locator("> div")
    await expect(thumbnails.first()).toBeVisible() //Wait for the carousel's images to finish loading before counting them
    const numOfImages = await thumbnails.count()
    expect(numOfImages).toBeGreaterThan(0)

    for(let i = 0; i < numOfImages; i++)
        await thumbnails.nth(i).locator(".cursor-pointer").click()

    //ASSERTION: Reservation information is displayed clearly
    await expect(page1.getByRole("heading", {name: "Reservation Name"}).first()).toBeVisible()
    const nameValues = page1.locator("div.mt-1.text-sm.break-all:visible")
    await expect(nameValues.nth(0)).toHaveText(/\S+/) //Reservation First Name
    await expect(nameValues.nth(1)).toHaveText(/\S+/) //Reservation Last Name
    await expect(nameValues.nth(2)).toHaveText(/\S+/) //Guest First Name
    await expect(nameValues.nth(3)).toHaveText(/\S+/) //Guest Last Name
    await expect(page1.locator("li:visible").filter({hasText: "Check-in"})).toContainText(/\w+ \d{1,2}, \d{4}/) //Check-in/Check-out dates
    await expect(page1.locator("li:visible").filter({hasText: "Plan name"}).locator("div")).toHaveText(/\S+/)
    await expect(page1.locator("li:visible").filter({hasText: "Estimated arrival time"}).locator("div")).toHaveText(/\S+/)
    await expect(page1.locator("li:visible").filter({hasText: "Total"}).last()).toContainText("¥") //Final total row (".last()" avoids matching the "Subtotal" row)

    //await page1.pause()

});

