import * as cheerio from "npm:cheerio@1.0.0"
import { discoverLinks } from "../utils/discoverLinks.ts";
import { fetchHtmlWithPuppeteer } from "../utils/fetchHtmlWithPuppeteer.ts";
import { ScanResult } from "../typings/tools/scanner.d.ts";

export async function crawler(
  url: string,
  ignoreRedirects: boolean = true,
  verbose: boolean = false,
  visited = new Set<string>() // make visited persistent across recursions
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  if (visited.has(url)) return results;
  visited.add(url);
  results.push({ url });

  if (verbose) {
    console.log(`%c 🕸️  Crawling: ${url}`, "color: blue")
  }
  try {
    let html: string;

    html = await fetchHtmlWithPuppeteer(url);

    const response = await fetch(url);
    if (!response.ok) {
      if (ignoreRedirects && response.status >= 300 && response.status < 400) {
        console.warn(`Skipping redirect: ${url}`);
        return results;
      }
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return results;
    }

    html = await response.text();
    const $ = cheerio.load(html);
    const links = discoverLinks($, url);

    for (const link of links) {
      const childResults = await crawler(link, ignoreRedirects, verbose, visited);
      results.push(...childResults); // merge child results into this array
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

  return results;
}