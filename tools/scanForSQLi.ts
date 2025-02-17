import { sendRequest } from "../utils/sendRequest.ts"
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/mod.ts"
import { extractForms } from "../utils/formExtractor.ts"
import { scanForm } from "../utils/scanForm.ts"

/**
 * Scans a webpage for SQL injection vulnerabilities by discovering forms.
 */
export async function scanForSQLi(url: string): Promise<[string, string, string] | null> {
  console.log(`🔎 Scanning webpage: ${url}`);
  const forms = await extractForms(url);

  if (forms.length === 0) {
    return null;
  }
  
  for (const form of forms) {
    const result = await scanForm(url, form.action, form.method as 'GET' | 'POST', form.inputs);
    
    if (result) {
      // result should be [url, parameter, payload]
      return result;
    }
  }

  return null
}