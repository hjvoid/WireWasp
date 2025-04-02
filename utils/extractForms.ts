import puppeteer from "npm:puppeteer@24.1.0"
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { FormScanResult } from "../typings/tools/scanner.d.ts";
import { scanForm } from "./scanForm.ts";

export async function extractForms(url: string, verbose: boolean): Promise<FormScanResult[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let results: FormScanResult[] = [];
  
    if (verbose) {
      console.log(`%c 📡 Extracting forms and inputs at ${url}...`, "color: turquoise");
    }
    await page.goto(url, { waitUntil: 'networkidle2' });
  
    const inputs = await page.$$eval('input, textarea, select', (elements) =>
      elements
        .filter((elements) => elements.hasAttribute('name'))
        .map((elements) => ({
          name: elements.getAttribute('name') || '',
          type: elements.getAttribute('type') || 'text',
        }))
    );
  
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
      const runSQLI = prompt("Do you want to scan for SQL injection vulnerabilities in the forms? (y/n): ");
      if (runSQLI?.toLowerCase() === 'y' || runSQLI?.toLowerCase() === 'yes') {
        for (const form of results) {
          await scanForm(url, form.action, form.method as "GET" | "POST", inputs.map((input) => input.name), verbose);
        }
      }
    }

    return results
  }