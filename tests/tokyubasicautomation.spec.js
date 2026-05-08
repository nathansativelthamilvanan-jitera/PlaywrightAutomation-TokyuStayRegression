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
    fixedEmail:"nathan.sativelthamilvanan+payerrortest1@jitera.com",
    fixedPassword:"Newpassword1",

    //MEMBERSHIP REGISTRATION
    memberReg_Email:"mugwardad@pngk.uk", //Each time "Member Registration" test case is run, update this string
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
    editProfile_FirstName:"SativelU",
    editProfile_LastName:"NathanU",
    editProfile_FirstName_Kana:"アア",
    editProfile_LastName_Kana:"エエ",
    editProfile_Country:"Germany",
    editProfile_Zipcode:"2222222",
    editProfile_State:"StateU",
    editProfile_City:"CityU",
    editProfile_Address:"AddressU",
    editProfile_PhoneNumber:"+2222222222",
    editProfile_Birthday_YearRange:"1941 – 1950", // <-- Uses an EN DASH, not a normal hyphen. Code fails if use normal hyphen
    editProfile_Birthday_Year:"1950",
    editProfile_Birthday_Month:"July",
    editProfile_Birthday_Day:"23",
    editProfile_Gender:"Female",

    //RESET PASSWORD
    resetPW_Email:"kithayfig@otona.uk",
    resetPW_Password:"Newpassword16", //Each time "Reset Password" test case is run, update this string

    //INSTADDR DUMMY MAILBOX
    instAddrAccountID:"411715231887",
    instAddrPassword:"BU1iapx42ol:Y5Dk",

    //CREATE, EDIT, CANCEL RESERVATION
    hotelBranch: "Tokyu Stay Ginza(staging)",
    checkInDate: "May 8, 2026",
    checkOutDate: "May 9, 2026",
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
//Some refactoring required for the InstAddr page related code & add some additional assertion in the "SmartClub Confirm Details" page (the one with the edit button)
test('Tokyu Stay - Pure Membership Registration', async ({browser,page})=>
{
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    await page1.goto("https://stg.reservation.tokyustay.co.jp/en");
    await expect(page1).toHaveTitle('Accommodation reservations | Tokyu Stay [Official]');

    await page1.locator("a[href*='mypage/register']").click()
    
    //Ensure SmartClub page language is default Japanese
    await page1.waitForTimeout(3*1000) //Wait for 1.5 seconds to ensure everything loads (Cause there is a split second where the page changes for a bit)
    await page1.locator("button.p-header__translate__button").click()
    await page1.locator(".p-header__translate__lang").first().click()

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
    await expect(page1.locator(".eng-text-register__mail")).toHaveText("Confirmation email has been sent")

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
        frame.locator("a[href*='gateway.exwa']").first().click()//The action that opens the new window
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

    await expect(page3.locator("span.eng-text-register__mail")).toContainText("Registration completed.")

    await page3.locator("a.c-button").click()//Click "Service button"

    await expect(page3).toHaveURL("https://stg.reservation.tokyustay.co.jp/en")

    //await page3.pause()

});

//STATUS: OK
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

    //Ensure SmartClub page1 language is default Japanese
    const btn = page1.locator("button.p-header__translate__button:visible")
    await expect(btn).toBeEnabled();     // ensures hydration done
    await expect(btn).toBeInViewport();  // ensures no overlays
    await btn.click();
    await page1.locator(".p-header__translate__lang").first().click()
    

    await page1.getByPlaceholder("例）user@smartclub.tokyu-rs.co.jp").fill(info.resetPW_Email)
    await page1.getByRole("button", {name: "パスワード再発行 / Send email"}).click()
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
        frame.locator("a[href*='gateway.exwa']").first().click()//The action that opens the new window
    ])

    //PAGE 2
    //Ensure SmartClub page language is default Japanese
    await page1.waitForTimeout(4*1000) //Wait for 1.5 seconds to ensure everything loads (Cause there is a split second where the page changes for a bit)
    const btn2 = page2.locator("button.p-header__translate__button");
    await expect(btn2).toBeEnabled();     // ensures hydration done
    await expect(btn2).toBeInViewport();  // ensures no overlays
    await btn2.click();
    await page2.locator(".p-header__translate__lang").first().click()

    await page2.getByPlaceholder("新しいパスワード / New password").fill(info.resetPW_Password)
    await page2.getByPlaceholder("確認用に再入力 / Re-enter for confirmation").fill(info.resetPW_Password)
    await page2.getByRole("button", {name: "パスワード再発行 / Reset password"}).click()
    await page1.waitForTimeout(4*1000)
    await expect(page2.locator("p.title")).toHaveText("パスワードを変更しました。")

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

    await page3.pause()

});         

//STATUS: OK
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
    await page1.locator("abbr[aria-label*='" + info.checkInDate + "']").click()
    await page1.locator("abbr[aria-label*='" + info.checkOutDate + "']").click()
    await page1.locator("button.w-full").nth(2).click()
    await page1.locator("svg[stroke*='A7A7A7']").nth(1).click()
    await page1.getByRole("button", {name: "Confirm"}).click()
    await page1.getByRole("button", {name: "Search"}).click()
    await expect(page1.getByText('Available Plans', { exact: true }).first()).toBeVisible() 
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

    await page1.pause()

    
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

    await returnedPage.pause()
});


//STATUS: TODO
test('Tokyu Stay - Reservation History', async ({browser, page})=>
{
    const context1 = await browser.newContext()
    const page1 = await Login(page)

    //GO TO BOOKINGS TAB
    await page1.locator("a[href*='my-page/profile']").click()
    await page1.getByRole("listitem").locator("a[href*='reservations']").click()
    await expect(await page1.getByText("Bookings").first()).toBeVisible()
    await page1.waitForLoadState("load")

    //COMPLETE TAB
    await page1.locator("a[href*='reservations?status=done']").first().click()
    await page1.locator("div div button.items-start").first().click()
    await page1.getByRole("button", {name: "Details & QR"}).click()
    await page1.waitForLoadState("load")
    await page1.waitForSelector("span.uppercase")

    //COMPLETED - Check images
    let numOfImages = await page1.locator("div.flex.cursor-default.space-x-4").first().locator("> div").count();
    console.log("numOfImages COMPLETED: " + numOfImages)

    for(let i = 0; i < numOfImages; i++)
        await page1.locator("div.cursor-pointer").locator("svg[xmlns*='2000/svg']").first().click({clickCount: numOfImages})

    for(let i = 0; i < numOfImages; i++)
        await page1.locator("div.cursor-default").locator("svg[xmlns*='2000/svg']").first().click({clickCount: numOfImages})


    //COMPLETED - Check QR Code
    await page1.locator("a[href*='qrcode']:visible").click()
    await expect(page1.locator("div canvas:visible")).toBeVisible()
    await page1.locator("a[href*='#']").click()


    //COMPLETED - Verify Booking Details
    await expect(page1.locator("div.mt-1").nth(4)).toHaveText(/\S+/) //Check if First Name has any character displayed
    await expect(page1.locator("div.mt-1").nth(5)).toHaveText(/\S+/) //Check if Last Name has any character displayed
    await expect(page1.locator("div.mt-1").nth(6)).toHaveText(/\S+/) //Check if Guest First Name has any character displayed
    await expect(page1.locator("div.mt-1").nth(7)).toHaveText(/\S+/) //Check if Guest Last Name has any character displayed
    await expect(page1.locator("div.text-sm").nth(23)).toHaveText(/\S+/) //Check in Date
    await expect(page1.locator("div.text-sm").nth(24)).toHaveText(/\S+/) //Check out Date
    await expect(page1.locator("div.text-sm").nth(25)).toHaveText(/\S+/) //Plan Name
    await expect(page1.locator("div.text-sm").nth(27)).toHaveText(/\S+/) //Estimated Arrival Time
    await expect(page1.locator("div.text-sm").nth(29)).toHaveText(/\S+/) //Subtotal
    await expect(page1.locator("div.text-sm").nth(30)).toHaveText(/\S+/) //Points Used
    await expect(page1.locator("div.text-sm").nth(31)).toHaveText(/\S+/) //Membership Discount
    await expect(page1.locator("div.text-sm").nth(32)).toHaveText(/\S+/) //Promotion Discount
    await expect(page1.locator("div.text-sm").nth(33)).toHaveText(/\S+/) //Total Amount
    await expect(page1.locator("label.text-xs").nth(29)).toHaveText(/\S+/) //Points returned after cancellation fine print text


    /*
    //Check View Map (opens a new tab)
    const [page2] = await Promise.all(
    [
        context1.waitForEvent("page"),
        page1.locator("div.text-sm.ml-1:visible").click()
    ])

    await expect(page2).toHaveURL("https://www.google.com/maps/place/35%C2%B039'48.4%22N+139%C2%B045'25.2%22E/@35.663455,139.7544121,17z/data=!3m1!4b1!4m4!3m3!8m2!3d35.663455!4d139.756987?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoKLDEwMDc5MjA3MUgBUAM%3D")
    */
    
    //await page2.pause()


    //CANCELLED TAB
    await page1.locator("a[href='/en/my-page/reservations']").first().click()
    await page1.locator("a[href='/en/my-page/reservations?status=cancelled']").first().click()
    await page1.locator("div div button.items-start").first().click()
    await page1.getByRole("button", {name: "Details & QR"}).click()
    await page1.waitForLoadState("load")
    await page1.waitForSelector("span.uppercase")


    //CANCELLED - Verify Booking Details
    await expect(page1.locator("div.mt-1").nth(4)).toHaveText(/\S+/) //Check if First Name has any character displayed
    await expect(page1.locator("div.mt-1").nth(5)).toHaveText(/\S+/) //Check if Last Name has any character displayed
    await expect(page1.locator("div.mt-1").nth(6)).toHaveText(/\S+/) //Check if Guest First Name has any character displayed
    await expect(page1.locator("div.mt-1").nth(7)).toHaveText(/\S+/) //Check if Guest Last Name has any character displayed
    await expect(page1.locator("div.text-sm").nth(23)).toHaveText(/\S+/) //Check in Date
    await expect(page1.locator("div.text-sm").nth(24)).toHaveText(/\S+/) //Check out Date
    await expect(page1.locator("div.text-sm").nth(25)).toHaveText(/\S+/) //Plan Name
    await expect(page1.locator("div.text-sm").nth(27)).toHaveText(/\S+/) //Estimated Arrival Time
    await expect(page1.locator("div.text-sm").nth(29)).toHaveText(/\S+/) //Subtotal
    await expect(page1.locator("div.text-sm").nth(30)).toHaveText(/\S+/) //Points Used
    await expect(page1.locator("div.text-sm").nth(31)).toHaveText(/\S+/) //Membership Discount
    await expect(page1.locator("div.text-sm").nth(32)).toHaveText(/\S+/) //Promotion Discount
    await expect(page1.locator("div.text-sm").nth(33)).toHaveText(/\S+/) //Total Amount

    //CANCELLED - Check images
    numOfImages = await page1.locator("div.flex.cursor-default.space-x-4").first().locator("> div").count();
    console.log("numOfImages CANCELLED: " + numOfImages)

    for(let i = 0; i < numOfImages; i++)
        await page1.locator("div.cursor-pointer").locator("svg[xmlns*='2000/svg']").first().click({clickCount: numOfImages})

    for(let i = 0; i < numOfImages; i++)
        await page1.locator("div.cursor-default").locator("svg[xmlns*='2000/svg']").first().click({clickCount: numOfImages})

    //CANCELLED - Check QR Code
    await page1.locator("a[href*='qrcode']:visible").click()
    await expect(page1.locator("div canvas:visible")).toBeVisible()
    await page1.locator("a[href*='#']").click()




    //await page1.pause()

    //UPCOMING TAB
    /*
    await page1.locator("a[href='/en/my-page/reservations']").first().click()
    await page1.locator("a[href='/en/my-page/reservations']").first().click()
    await page1.locator("div div button.items-start").first().click()
    await page1.getByRole("button", {name: "Details & QR"}).click()
    await page1.waitForLoadState("load")
    await page1.waitForSelector("span.uppercase")

    //Check images
    numOfImages = await page1.locator("div.flex.cursor-default.space-x-4").first().locator("> div").count();
    console.log("numOfImages: " + numOfImages)

    for(let i = 0; i < numOfImages; i++)
        await page1.locator("div.cursor-pointer").locator("svg[xmlns*='2000/svg']").first().click({clickCount: numOfImages})

    for(let i = 0; i < numOfImages; i++)
        await page1.locator("div.cursor-default").locator("svg[xmlns*='2000/svg']").first().click({clickCount: numOfImages})
    */

    //await page1.pause()

})


//STATUS: TODO
//Figure out how to make Playwright click the button on the Payment Gateway modal at the last step
test.only('Tokyu Stay - Logged In Reservation', async({page})=>
{
    const page1 = await Login(page)

    await page1.locator(".relative.bg-white").last().click()
    await page1.getByText(info.hotelBranch).click()
    await page1.locator(".text-lg").first().click()
    await page1.locator("abbr[aria-label*='" + info.checkInDate + "']").click()
    await page1.locator("abbr[aria-label*='" + info.checkOutDate + "']").click()
    await page1.locator("button.w-full").nth(2).click()
    await page1.locator("svg[xmlns*='w3.org']").nth(4).click()
    await page1.getByRole("button", {name: "Confirm"}).click()
    await page1.getByRole("button", {name: "Search"}).click()

    //ASSERTION: Available Plans displays once the search results are loaded, so we do an assertion for it
    await expect(page1.getByText('Available Plans', { exact: true }).first()).toBeVisible() 
    await page1.getByRole("button", {name: "Book now"}).nth(3).click()

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
    await page1.locator('[name="cardBrand"]').last().click()//Open the Card Type dropdown <----- Andra implemented the new CC improvement, so need to change it
    await page1.getByRole("option", {name: "JCB"}).click()//Click the specified card type
    await page1.locator('[name="cardName"]').fill("SATIVEL")//Fill in Cardholder Name
    await page1.locator('[name="cardNumber"]').fill("3528000000005006")//Fill in Card
    await page1.locator('[name="expiredDate"]').fill("0126")//Fill in Expiry Date
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
    await page.locator('iframe').contentFrame().getByRole('button', { name: '決済に進む' }).click();

    //ASSERTION: Check if the user has reached the Successfully Booked screen
    await expect(page1.locator("h1.text-secondary")).toHaveText("Successfully Booked")
    await page1.pause()

});

