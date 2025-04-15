import { ScanResult } from "../typings/tools/scanner.d.ts";
import { sqlInjectorWithCurl } from "./sqlInjectorWithCurl.ts"
import { extractForms } from "./extractForms.ts";
import { crawler } from "./crawler.ts";
import { paramBasedSQLInjector } from "./paramBasedSQLInjector.ts";
import logger from "../utils/logger.ts";

export async function scanner(
  startUrl: string,
  ignoreRedirects: boolean = true,
  sqliInit: boolean = false,
  findForms: boolean = false,
  paramSQLIScan: boolean = false,
  crawl: boolean = false,
  headless: boolean = true,
  verbose: boolean = false
): Promise<ScanResult[]> {
  let results = [] as ScanResult[];

  if (crawl) {
    results = await crawler(startUrl, ignoreRedirects, headless, verbose)
  } else {
    results.push({ url: startUrl });
  }

  if (!!results && results.length > 1) {
    console.log("\n");
      logger(`   Found ${results.length} URLs: `, "turquoise");
    results.forEach((result, index) => {
      logger(`   [${index}] ${result.url}`, "turquoise");
    });
    console.log("\n");

    const urlToTest = prompt("Please enter the index of the URL you'd like to test: ");

    if (urlToTest && !isNaN(Number(urlToTest))) {
      const runSQLI = prompt(`Would you like to run param based SQL Injector on ${results[Number(urlToTest)]?.url}? (y/N): `);
      if (runSQLI?.toLowerCase() === 'y' || runSQLI?.toLowerCase() === 'yes') {
        const forms = await extractForms(results[Number(urlToTest)].url, headless, verbose);

        if (forms) {
          forms.forEach((form) => {
            results[Number(urlToTest)].formScanResult = form;
          })
        } 
      }
    } else {
      logger("   Invalid input. Please enter a valid index.", "red");
      Deno.exit(1);
    }
  } else if (results && results.length === 1) {

    console.log("\n");

    if (!!results && results.length < 2 && sqliInit) {
      await Promise.all(
        results.map(async (result) => {
          logger(` Invoking scanForSQLI on ${result.url}`, "pink");
          await sqlInjectorWithCurl(result.url, verbose);
        })
      );
    }

    if (!!results && results.length < 2 && paramSQLIScan) {
      await Promise.all(
        results.map(async (result) => {
          const paramSQLInjectionResult = await paramBasedSQLInjector(result.url, verbose);
          if (paramSQLInjectionResult) {
            results[results.indexOf(result)].paramBasedSQLI = paramSQLInjectionResult;
          }
        })
      )
    }
   
    if (!!results && results.length < 2 && findForms) {
      await Promise.all(
        results.map(async (result) => {       
          const forms = await extractForms(result.url, headless, verbose);
          if (forms) {
            forms.forEach((form) => {
              results[results.indexOf(result)].formScanResult = form;
            })
          }
        })
      );
    }
  }

  return results || [];
}