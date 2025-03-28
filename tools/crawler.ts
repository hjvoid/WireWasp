import * as cheerio from "npm:cheerio@1.0.0"
import puppeteer from "npm:puppeteer@24.1.0"
import { scanForSQLi } from "./scanForSQLi.ts"
import { extractForms } from "../utils/formExtractor.ts";

interface SQLiFinding {
  url: string;
  parameter: string;
  injectionPayload: string;
}

interface CrawlResult {
  url: string;
  formsFound?: number;
  sqliFindings?: SQLiFinding[]; // Optional, only present if SQLi is found
}

  const visited = new Set<string>()
  
  /**
   * Crawl a URL to find links and forms.
   * @param {string} startUrl - The starting URL.
   * @param {boolean} useHeadless - Use Puppeteer for JavaScript-rendered pages.
   * @returns {Promise<CrawlResult[]>} - A list of crawled URLs and their forms.
   */
  export async function crawlUrl(
    startUrl: string,
    useHeadless: boolean = false,
    ignoreRedirects: boolean = true ,
    sqliInit: boolean = false,
    verbose: boolean = false
  ): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []

    async function crawl(url: string) {
      if (visited.has(url)) return
      visited.add(url)
      results.push({url})
      if (verbose) {
        console.log(`%c 🕸️ Crawling: ${url}`, "color: blue")
      }
      try {
        let html: string
  
        if (useHeadless) {
          html = await fetchHtmlWithPuppeteer(url)
        } else {
          const response = await fetch(url) 
          if (!response.ok) {
            if (ignoreRedirects && response.status >= 300 && response.status < 400) {
              console.warn(`Skipping redirect: ${url}`)
              return
            }
            console.error(`Failed to fetch ${url}: ${response.status}`)
            return
          }
          html = await response.text()
        }
  
        const $ = cheerio.load(html)
        const links = discoverLinks($, url)

        for (const link of links) {
          await crawl(link)
        }
        
      } catch (error) {
        if (error instanceof Error) {
          console.error(`%c Error crawling ${url}: ${error}`, "color: red")
          Deno.exit(1)
        } else {
          console.error(`%c Unknown error crawling ${url}`, "color: red")
          Deno.exit(1)
        }
      }
    }
     
    await crawl(startUrl)
    console.log("\n");
    
    if (sqliInit) {
      const scanResults = await Promise.all(
        results.map(async (result) => {
          try {
            const sqliResult = await scanForSQLi(result.url, verbose);
            const forms = await extractForms(result.url, verbose);
            if (forms.length) {
              results[results.indexOf(result)].formsFound = forms.length
            } 
            if (sqliResult) {
              // sqliResult is an array [url, parameter, payload]
              const [url, parameter, injectionPayload] = sqliResult;
              return { url: result.url, sqliFindings: [{ url, parameter, injectionPayload }] };
            }
          } catch (error) {
            console.error(`%c Scan failed for ${result.url}: ${error}`, "color: red");
          }
          return null;
        })
      );
  
      // Merge SQLi scan results into the main results array
      for (const scanResult of scanResults.filter((result): result is CrawlResult => result !== null && result.sqliFindings !== undefined)) {
        if (scanResult) {
          const existingResult = results.find((existing) => existing.url === scanResult.url);
          if (existingResult) {
            existingResult.sqliFindings = scanResult.sqliFindings;
          }
        }
      }
    }  
    
    return results
  }  
  
  /**
   * Fetch HTML using Puppeteer for JavaScript-rendered pages.
   * @param {string} url - The URL to fetch.
   * @returns {Promise<string>} - The HTML content.
   */
  async function fetchHtmlWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle2" })
    const content = await page.content()
    await browser.close()
    return content
  }
  
  /**
   * Discover internal links on a page.
   * @param {cheerio.Root} $ - The Cheerio instance.
   * @param {string} baseUrl - The base URL of the page.
   * @returns {string[]} - A list of internal links.
   */
function discoverLinks($: cheerio.Root, baseUrl: string): string[] {
  const links: string[] = [];

  $('a[href]').each((index: number, element: any) => {
    let href = $(element).attr('href');
    if (href && !href.startsWith('http')) {
      href = new URL(href, baseUrl).href;
    }

    if (href && href.startsWith(baseUrl) && !href.includes('/redirect?')) {
      links.push(href);
    }
  });

  return Array.from(new Set(links));
}