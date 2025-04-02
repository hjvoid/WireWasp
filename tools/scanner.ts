import { ScanResult } from "../typings/tools/scanner.d.ts";
import { sqlInjectorWithCurl } from "./sqlInjectorWithCurl.ts"
import { extractForms } from "../utils/extractForms.ts";
import { crawler } from "./crawler.ts";
import { paramBasedSQLInjector } from "./paramBasedSQLInjector.ts";

export async function scanner(
  startUrl: string,
  ignoreRedirects: boolean = true,
  sqliInit: boolean = false,
  findForms: boolean = false,
  paramSQLIScan: boolean = false,
  verbose: boolean = false
): Promise<ScanResult[]> {

  const results = await crawler(startUrl, ignoreRedirects, verbose)

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
        const forms = await extractForms(result.url, verbose);
        if (forms) {
          forms.forEach((form) => {
            results[results.indexOf(result)].formScanResult = form; 
          })
        }
      })
    );
  }

  return results || [];
}