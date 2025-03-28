import { sendRequest } from "../utils/sendRequest.ts"
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/mod.ts"

export async function scanForm(url: string, action: string, method: 'GET' | 'POST', inputs: string[], verbose: boolean): Promise<[string, string, string] | null> {
  const formURL = new URL(action, url).href // Handle relative form actions

  if (verbose) {
    console.log(`%c 🔍 Scanning form at ${formURL} (${method}) with fields: ${inputs.join(', ')}`, "color: yellow")
  }

  const file = await Deno.open("./payloads/quick-SQLi.txt", { read: true })
  const payloads = file
    .readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
  const sqlErrorPattern = /(sql syntax|mysql_fetch|syntax error|warning.*mysql|quoted string not properly terminated|unclosed quotation mark|you have an error in your sql|unexpected end of sql command|error in your SQL syntax|invalid SQL statement|unknown column|table '.*' doesn't exist|column count doesn't match|operand should contain|unterminated quoted string|invalid input syntax for|malformed query|operator does not exist|subquery has too many columns|current transaction is aborted|invalid escape sequence|zero-length delimited identifier|incorrect syntax near|invalid column name|conversion failed|procedure or function expects parameter|multi-part identifier could not be bound|invalid object name|ambiguous column name|ORA-00933|ORA-01756|ORA-00904|ORA-01747|ORA-00942|ORA-01456|ORA-01789|ORA-06550)/i

  for (const param of inputs) {
    if (verbose) {
      console.log(`Testing parameter: ${param}`)
    }

    for await (const payload of payloads) {

      const params = {} as Record<string, string>
      params[param] = payload // Inject payload

      try {
        const response = await sendRequest(
          formURL,
          method === 'GET' ? params : {},
          method === 'POST' ? params : {},
          method
        )

        if (sqlErrorPattern.test(response.data)) {
          if (verbose) {
            console.log(`%c 🚨 Possible SQL injection detected! Parameter: "${param}" with payload: "${payload}"`, "color: pink")
          }
          return [url, param, payload]
        }
      } catch (error) {
        console.error(`😭 Error testing parameter "${param}" with payload "${payload}":`, error)
      }
    }
  }
  //Close the file if still open, and safe to call after the file already closed
  //Can apparetnly be mitigated by using the 'using' keyword in Typescript?
  try {
    file[Symbol.dispose]()
  } catch (error) {
    console.log(error)
  }
  return null
}