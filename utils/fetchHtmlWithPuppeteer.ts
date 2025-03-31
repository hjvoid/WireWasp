import puppeteer from "npm:puppeteer@24.1.0"
/**
 * Fetch HTML using Puppeteer for JavaScript-rendered pages.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} - The HTML content.
 */
export async function fetchHtmlWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle2" })
    const content = await page.content()
    await browser.close()
    return content
}