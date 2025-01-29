import axios from 'npm:axios@1.7.9'
import { cheerio } from "https://deno.land/x/cheerio@1.0.7/mod.ts";
import puppeteer from "npm:puppeteer@24.1.0"


/**
 * Extracts form details from a dynamically rendered webpage using Puppeteer.
 * @param url - The target webpage URL.
 * @returns An array of extracted forms.
 */
export async function extractForms(url: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    console.log(`📡 Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' }); // Wait for page to fully load
  
    // Extract input fields that have a "name" attribute (common for forms)
    const inputs = await page.$$eval('input, textarea, select', (elements) =>
      elements
        .filter((elements) => elements.hasAttribute('name'))
        .map((elements) => ({
          name: elements.getAttribute('name') || '',
          type: elements.getAttribute('type') || 'text',
        }))
    );
  
    // Extract form action URLs and methods
    const forms = await page.$$eval('form', (formElements) =>
      formElements.map((form) => ({
        action: form.getAttribute('action') || '',
        method: (form.getAttribute('method') || 'GET').toUpperCase(),
      }))
    );
  
    await browser.close();
  
    // If no traditional forms are found, create a pseudo-form from detected input fields
    if (forms.length === 0 && inputs.length > 0) {
      console.log('⚠️ No <form> elements detected. Generating pseudo-form from inputs...');
      return [{ action: url, method: 'POST', inputs: inputs.map((input) => input.name) }];
    }
  
    // Attach input names to each detected form
    return forms.map((form) => ({
      ...form,
      inputs: inputs.map((input) => input.name), // Assume all detected inputs belong to each form
    }));
  }