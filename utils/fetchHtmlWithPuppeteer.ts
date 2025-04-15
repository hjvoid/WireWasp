import puppeteer from "npm:puppeteer@24.1.0"

export async function fetchHtmlWithPuppeteer(url: string, headless: boolean): Promise<string> {
    const browser = await puppeteer.launch({headless: headless, args: ['--incognito']})
    const page = await browser.newPage()

    const cookieString = await Deno.readTextFile("./cookies.json")
    const cookies = JSON.parse(cookieString)
    await browser.setCookie(...cookies)
    
    await page.goto(url, { waitUntil: "networkidle2" })
    const content = await page.content()
    
    await browser.close()
    return content
}