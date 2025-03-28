import { extractForms } from "../utils/formExtractor.ts"
import { scanForm } from "../utils/scanForm.ts"

/**
 * Scans a webpage for SQL injection vulnerabilities by discovering forms.
 */
export async function scanForSQLi(url: string, verbose: boolean): Promise<[string, string, string] | null> {
  const forms = await extractForms(url, verbose);

  if (forms.length === 0) {
    return null;
  }
  
  for (const form of forms) {
    const result = await scanForm(url, form.action, form.method as 'GET' | 'POST', form.inputs, verbose);
    
    if (result) {
      // result should be [url, parameter, payload]
      return result;
    }
  }

  return null
}