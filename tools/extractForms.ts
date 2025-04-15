import puppeteer from "npm:puppeteer@24.1.0"
import { FormScanResult } from "../typings/tools/scanner.d.ts";
import { scanForm } from "../utils/scanForm.ts";
import logger from "../utils/logger.ts";

export async function extractForms(url: string, headless: boolean, verbose: boolean): Promise<FormScanResult[]> {
    const browser = await puppeteer.launch({headless: headless, args: ['--incognito']});
    const page = await browser.newPage(); 
    const cookieString = await Deno.readTextFile("./cookies.json")
    const cookies = JSON.parse(cookieString)
    await browser.setCookie(...cookies)

    let results: FormScanResult[] = [];
  
    if (verbose) {
      logger(` 📡 Extracting forms and inputs at ${url}`, "blue");
    }
    await page.goto(url, { waitUntil: "networkidle2" })
    // const content = await page.content()
  
    const inputs = await page.$$eval('input, textarea, select', (elements) =>
      elements
        .filter((element) => element.hasAttribute('name') && element.getAttribute('name')?.trim() !== '')
        .map((element) => ({
          name: element.getAttribute('name'),
          type: element.getAttribute('type') || element.tagName.toLowerCase(),
        }))
    );   
    
    const reducedInputs = inputs.reduce((acc: { name: string; type: string }[], input) => {
      const exists = acc.find(item => item.name === input.name);
      if (!exists) {
        acc.push(input);
      }
      return acc;
    }, []);

    const forms = await page.$$eval('form', (formElements) => {
      return formElements
        .map((form) => ({
          action: form.getAttribute('action') || '',
          method: (form.getAttribute('method') || 'GET').toUpperCase(),
        }))
        .filter((form) => form.action.trim() !== '');
    });

    await browser.close();
  
    // Make sure elements not enclosed within a <form> element are not ignored.
    if (forms.length === 0 && reducedInputs.length > 0) { 
      logger(`    ⛔ No forms found and on ${url}`, "orange");     
      return [{ action: url, method: 'POST', inputs: inputs.map((input) => input.name) }];
    }
    
    results = forms.map((form) => ({
      ...form,
      inputs: reducedInputs.map((input) => input.name),
    }));

    if (results.length > 0) {
      console.log("\n");
      logger(`   Found ${results.length} form on ${url}: `, "blue")
      const runSQLI = prompt("Do you want to scan for SQL injection vulnerabilities in the forms? (y/N): ")
      if (runSQLI?.toLowerCase() === 'y' || runSQLI?.toLowerCase() === 'yes') {
        for (const form of results) {
          await scanForm(url, form.action, form.method, reducedInputs.map((input) => input.name), headless, verbose)
        }
      }
    }

    return results
  }