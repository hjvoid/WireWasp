import * as cheerio from "npm:cheerio@1.0.0"
import puppeteer from "npm:puppeteer@24.1.0"
import { sqlInjector } from "./sqlInjector.ts"
import { extractForms } from "../utils/extractForms.ts";
import { crawler } from "./crawler.ts";


interface ScanResult {
  url: string;
  formsFound?: number; // Optional, only present if SQLi is found
}

/**
 * Crawl a URL to find links and forms.
 * @param {string} startUrl - The starting URL.
 * @returns {Promise<ScanResult[]>} - A list of crawled URLs and their forms.
 */
export async function scanner(
  startUrl: string,
  ignoreRedirects: boolean = true,
  sqliInit: boolean = false,
  findForms: boolean = false,
  verbose: boolean = false
): Promise<ScanResult[]> {

  const results = await crawler(startUrl, ignoreRedirects, verbose)

  console.log("\n");

  if (results && sqliInit) {
    await Promise.all(
      results.map(async (result) => {
        console.log(`%c Invoking scanForSQLI on ${result.url}`, "color: pink");
        await sqlInjector(result.url, verbose);
      })
    );
  }

  if (results && findForms) {
    await Promise.all(
      results.map(async (result) => {
        const forms = await extractForms(result.url, verbose);
        if (forms.length) {
          results[results.indexOf(result)].formsFound = forms.length;
        }
        return { ...result, formsFound: forms.length };
      })
    );
  }

  return results || [];
}