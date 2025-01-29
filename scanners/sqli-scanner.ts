import { sendRequest } from "../utils/sendRequest.ts"
import { TextLineStream } from 'https://deno.land/std/streams/mod.ts'


export async function scanURL(url: string): Promise<void> {
    console.log(`Scanning ${url} for SQLi`);
    
    const file = await Deno.open("./payloads/quick-SQLi.txt", { read: true })
    const payloads = file
        .readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
    const params = extractParams(url);
    if (params.length === 0) {
        console.log('No parameters found in the URL.');
        return;
    }

    console.log(`Found parameters: ${params.join(', ')}`);

    for (const param of params) {
        console.log(`Testing parameter: ${param}`);

        for await (const payload of payloads) {
            const parsedUrl = new URL(url);
            parsedUrl.searchParams.set(param, payload);

            try {
                const response = await sendRequest(parsedUrl.toString(), {});
          
                if (response.data.includes('SQL syntax') || response.data.includes('error in your SQL')) {
                  console.log(
                    `%c 🚨 Possible SQL injection vulnerability detected with payload: ${payload}`, 
                    "color: red"
                );
                  return;
                }
              } catch (error) {
                console.error(`Error testing payload ${payload}:`, error);
              }
        }
    }

    /**
    * Close the file if still open, and safe to call after the file already closed
    * Can apparetnly be mitigated by using the 'using' keyword in Typescript?
    */
   
    try {
        file[Symbol.dispose]();
      } catch (error) {
        console.log(error);
      }
}

function extractParams(url: string): string[] {
    try {
        const parsedUrl = new URL(url)
        return [...parsedUrl.searchParams.keys()]
    } catch (error) {
        console.error(`Invalid URL:`, error)
        return []
    }
}