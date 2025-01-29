import { sendRequest } from "../utils/sendRequest.ts"
import { TextLineStream } from 'https://deno.land/std/streams/mod.ts'
import { extractForms } from "../utils/formExtractor.ts";


export async function scanForm(baseURL: string, action: string, method: 'GET' | 'POST', inputs: string[]): Promise<void> {
    const formURL = new URL(action, baseURL).href; // Handle relative form actions

    console.log(`\n🔍 Scanning form at ${formURL} (${method}) with fields: ${inputs.join(', ')}`);  

    const file = await Deno.open("./payloads/quick-SQLi.txt", { read: true })
    const payloads = file
        .readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())

    for (const param of inputs) {
        console.log(`Testing parameter: ${param}`);

        for await (const payload of payloads) {

            const params = {} as Record<string, string>;
            params[param] = payload; // Inject payload

            try {
                const response = await sendRequest(
                  formURL,
                  method === 'GET' ? params : {},
                  method === 'POST' ? params : {},
                  method
                );

        
                if (response.data.includes('SQL syntax') || response.data.includes('error in your SQL')) {
                  console.log(`🚨 Possible SQL injection detected! Parameter: "${param}" with payload: "${payload}"`);
                  return;
                }
              } catch (error) {
                console.error(`  ❌ Error testing parameter "${param}" with payload "${payload}":`, error);
              }
        }
    }    
    //Close the file if still open, and safe to call after the file already closed
    //Can apparetnly be mitigated by using the 'using' keyword in Typescript?
    try {
        file[Symbol.dispose]();
    } catch (error) {
        console.log(error);
    }
}

/**
 * Scans a webpage for SQL injection vulnerabilities by discovering forms.
 */
export async function scanForSQLi(url: string) {
    console.log(`\n🔎 Scanning webpage: ${url}`);
  
    const forms = await extractForms(url);
    if (forms.length === 0) {
      console.log('❌ No forms found on this page.');
      return;
    }
  
    console.log(`✅ Found ${forms.length} form(s).`);
    for (const form of forms) {
      await scanForm(url, form.action, form.method as 'GET' | 'POST', form.inputs);
    }
  }