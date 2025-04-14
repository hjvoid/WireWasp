import { ScanResult } from "../typings/tools/scanner.d.ts";
import { sqlInjectorWithCurl } from "./sqlInjectorWithCurl.ts"
import { extractForms } from "./extractForms.ts";
import { crawler } from "./crawler.ts";
import { paramBasedSQLInjector } from "./paramBasedSQLInjector.ts";

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
    console.log(`%c   Found ${results.length} URLs: `, "color: turquoise");
    results.forEach((result, index) => {
      console.log(`%c   [${index}] ${result.url}`, "color: turquoise");
    });
    console.log("\n");

    const urlToTest = prompt("Please enter the index of the URL you'd like to test: ");

    if (urlToTest && !isNaN(Number(urlToTest))) {
      const runSQLI = prompt(`Would you like to run param based SQL Injector on ${results[Number(urlToTest)]?.url}?: `);
      if (runSQLI?.toLowerCase() === 'y' || runSQLI?.toLowerCase() === 'yes') {
        const forms = await extractForms(results[Number(urlToTest)].url, headless, verbose);
        if (forms) {
          forms.forEach((form) => {
            results[Number(urlToTest)].formScanResult = form;
          })
        }
      }
    } else {
      console.error("%c   Invalid input. Please enter a valid index.", "color: red");
      Deno.exit(1);
    }
  } else if (results && results.length === 1) {

    console.log("\n");

    if (results && sqliInit) {
      await Promise.all(
        results.map(async (result) => {
          console.log(`%c Invoking scanForSQLI on ${result.url}`, "color: pink");
          await sqlInjectorWithCurl(result.url, verbose);
        })
      );
    }

    if (results && paramSQLIScan) {
      await Promise.all(
        results.map(async (result) => {
          const paramSQLInjectionResult = await paramBasedSQLInjector(result.url, verbose);
          if (paramSQLInjectionResult) {
            results[results.indexOf(result)].paramBasedSQLI = paramSQLInjectionResult;
          }
        })
      )
    }
   
    if (results && findForms) {
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