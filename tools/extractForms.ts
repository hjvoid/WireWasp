import puppeteer from "npm:puppeteer@24.1.0"
import { FormScanResult } from "../typings/tools/scanner.d.ts";
import { scanForm } from "../utils/scanForm.ts";

export async function extractForms(url: string, verbose: boolean): Promise<FormScanResult[]> {
    const browser = await puppeteer.launch({headless: false, args: ['--incognito']});
    const page = await browser.newPage(); 
    const cookieString = await Deno.readTextFile("./cookies.json")
    const cookies = JSON.parse(cookieString)
    await browser.setCookie(...cookies)
    
    let results: FormScanResult[] = [];
  
    if (verbose) {
      console.log(`%c 📡 Extracting forms and inputs at ${url}...`, "color: turquoise");
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
    console.log(inputs);
    
    
    const forms = await page.$$eval('form', (formElements) =>
      formElements.map((form) => ({
        action: form.getAttribute('action') || '',
        method: (form.getAttribute('method') || 'GET').toUpperCase(),
      }))
    );
    
    await browser.close();
  
    // Make sure elements not enclosed within a <form> element are not ignored.
    if (forms.length === 0 && inputs.length > 0) {
      return [{ action: url, method: 'POST', inputs: inputs.map((input) => input.name) }];
    }
    
    results = forms.map((form) => ({
      ...form,
      inputs: inputs.map((input) => input.name),
    }));

    if (results.length > 0) {
      console.log("\n");
      console.log(`%c   Found ${results.length} form on ${url}: `, "color: turquoise")
      const runSQLI = prompt("Do you want to scan for SQL injection vulnerabilities in the forms? (y/N): ")
      if (runSQLI?.toLowerCase() === 'y' || runSQLI?.toLowerCase() === 'yes') {
        for (const form of results) {
          await scanForm(url, form.action, form.method, inputs.map((input) => input.name), verbose)
        }
      }
    }

    return results
  }