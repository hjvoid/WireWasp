import puppeteer from "npm:puppeteer@24.1.0"

export async function getCookies (email: string, password: string, smsCode: string) {

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto("http://127.0.0.1:9400/login", { waitUntil: 'networkidle2' });

    await page.type("#username", email);
    await page.type("#password", password);
    
    await Promise.all([
        page.click("#continue"),
        page.waitForSelector("#sms_code", { visible: true, timeout: 3000 }),
      ]);

    await page.type("#sms_code", smsCode);
    await page.click("#continue");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 3000 });

    const cookies = await browser.cookies();
    
    await browser.close();
    
    try{
        await Deno.writeTextFile("./cookies.json", JSON.stringify(cookies, null, 2))
    } catch (error) {
        console.error("%c   Error saving cookies to file", "color: red");
        console.error(error);
    }
    
    return cookies;
}