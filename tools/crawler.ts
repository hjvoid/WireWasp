import { cheerio } from "https://deno.land/x/cheerio@1.0.7/mod.ts";
import puppeteer from "npm:puppeteer@24.1.0"

interface CrawlResult {
    url: string;
    forms: FormInfo[];
  }
  
  interface FormInfo {
    action: string;
    method: string;
    inputs: InputInfo[];
  }
  
  interface InputInfo {
    name: string;
    type: string;
  }
  
  const visited = new Set<string>();
  
  /**
   * Crawl a URL to find links and forms.
   * @param {string} startUrl - The starting URL.
   * @param {boolean} useHeadless - Use Puppeteer for JavaScript-rendered pages.
   * @returns {Promise<CrawlResult[]>} - A list of crawled URLs and their forms.
   */
  export async function crawlUrl(
    startUrl: string,
    useHeadless: boolean = false
  ): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
  
    async function crawl(url: string) {
      if (visited.has(url)) return;
      visited.add(url);
  
      console.log(`Crawling: ${url}`);
      try {
        let html: string;
        if (useHeadless) {
          html = await fetchHtmlWithPuppeteer(url);
        } else {
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`%c Failed to fetch ${url}: ${response.status}`, "color: red");
            return;
          }
          html = await response.text();
        }
  
        const $ = cheerio.load(html);
  
        // Discover forms
        const forms = discoverForms($, url);
        results.push({ url, forms });
  
        // Queue internal links for crawling
        const links = discoverLinks($, url);
        for (const link of links) {
          await crawl(link);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `%c Error crawling ${url}: ${error.message}`, "color: red");
        } else {
          console.error(`%c Unknown error crawling ${url}`, "color: red");
        }
      }
    }
  
    await crawl(startUrl);
    return results;
  }
  
  /**
   * Fetch HTML using Puppeteer for JavaScript-rendered pages.
   * @param {string} url - The URL to fetch.
   * @returns {Promise<string>} - The HTML content.
   */
  async function fetchHtmlWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const content = await page.content();
    await browser.close();
    return content;
  }
  
  /**
   * Discover forms on a page.
   * @param {cheerio.Root} $ - The Cheerio instance.
   * @param {string} baseUrl - The base URL of the page.
   * @returns {FormInfo[]} - A list of forms found on the page.
   */
  function discoverForms($: cheerio.Root, baseUrl: string): FormInfo[] {
    const forms: FormInfo[] = [];
  
    $('form').each((index: number, form: cheerio.Element) => {
      const action = $(form).attr('action') || baseUrl;
      const method = $(form).attr('method') || 'GET';
      const inputs: InputInfo[] = [];
  
      $(form).find('input').each((inputIndex: number, input: cheerio.Element) => {
        inputs.push({
          name: $(input).attr('name') || '',
          type: $(input).attr('type') || 'text',
        });
      });
  
      forms.push({ action, method, inputs });
    });
  
    return forms;
  }
  
  /**
   * Discover internal links on a page.
   * @param {cheerio.Root} $ - The Cheerio instance.
   * @param {string} baseUrl - The base URL of the page.
   * @returns {string[]} - A list of internal links.
   */
  function discoverLinks($: cheerio.Root, baseUrl: string): string[] {
    const links: string[] = [];
  
    $('a[href]').each((index: number, anchor: cheerio.Element) => {
      let href = $(anchor).attr('href');
      if (href && !href.startsWith('http')) {
        href = new URL(href, baseUrl).href; // Convert relative URL to absolute
      }
      if (href && href.startsWith(baseUrl)) {
        links.push(href);
      }
    });
  
    return Array.from(new Set(links)); // Deduplicate links
  }
  