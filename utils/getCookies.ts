import puppeteer from "npm:puppeteer@24.1.0"

export async function getCookies (email: string, password: string, smsCode: string) {

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto("http://127.0.0.1:9400/login", { waitUntil: 'networkidle2' });

    await page.type("#username", email);
    await page.type("#password", password);
    
    await Promise.all([
        page.click("#continue"),
        page.waitForSelector("#sms_code", { visible: true, timeout: 5000 }),
      ]);

    await page.type("#sms_code", smsCode);
    await page.click("#continue");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const cookies = await browser.cookies();

    
    try{
        await Deno.writeTextFile("./cookies.json", JSON.stringify(cookies, null, 2))
    } catch (error) {
        console.error("%c   Error saving cookies to file", "color: red");
        console.error(error);
    }
    
    await page.goto("http://127.0.0.1:9400/all-service-transactions/test\?pageSize\=5", { waitUntil: 'domcontentloaded' });
    await browser.close();

    return cookies;
}