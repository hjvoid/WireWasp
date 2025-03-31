import puppeteer from "npm:puppeteer@24.1.0"


/**
 * Extracts form details from a dynamically rendered webpage using Puppeteer.
 * @param url - The target webpage URL.
 * @returns An array of extracted forms.
 */
export async function extractForms(url: string, verbose: boolean) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
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
    
    return forms.map((form) => ({
      ...form,
      inputs: inputs.map((input) => input.name),
    }));
  }