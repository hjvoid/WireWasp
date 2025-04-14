import * as cheerio from "npm:cheerio@1.0.0"
import { discoverLinks } from "../utils/discoverLinks.ts";
import { fetchHtmlWithPuppeteer } from "../utils/fetchHtmlWithPuppeteer.ts";
import { ScanResult } from "../typings/tools/scanner.d.ts";
import logger from "../utils/logger.ts";

export async function crawler(
  url: string,
  ignoreRedirects = true,
  headless = true,
  verbose = false,
  visited = new Set<string>()
): Promise<ScanResult[]> {
  if (visited.has(url)) return [];
  visited.add(url);

  if (verbose) {
    logger(`🕸️  Crawling: ${url}`, "blue");
  }

  const results: ScanResult[] = [{ url }];

  try {
    const html = await fetchHtmlWithPuppeteer(url, headless);
    const $ = cheerio.load(html);
    const links = discoverLinks($, url);

    for (const link of links) {
      const nestedResults = await crawler(link, ignoreRedirects, headless, verbose, visited);
      results.push(...nestedResults);
    }
  } catch (err) {
    logger(
      `Error crawling ${url}: ${err instanceof Error ? err.message : "Unknown error"}`,
      "red"
    );
    Deno.exit(1);
  }

  return results;
}