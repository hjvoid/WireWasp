import { payloads, sqlErrorIndicators } from "../templates/basic_sqli.js"
import { load } from "cheerio"
import { fetchHtmlWithPuppeteer } from "../utils/fetchHtmlWithPuppeteer.ts"
import logger from "./logger.ts"

export async function scanForm(url: string, action: string, method: string, inputs: string[], headless: boolean, verbose: boolean): Promise<[string, string, string] | null> {

  const formURL = new URL(action, url).href

  if (verbose) {
    logger(`   🔍 Scanning form at ${formURL} (${method}) with fields: ${inputs.join(', ')}`, "purple")
  }

  for (const input of inputs) {
    for await (const payload of payloads) {
      const params: Record<string, string> = {}
      params[input] = payload

      let fullUrl = formURL

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&")

      fullUrl = `${formURL}?${queryString}`

      try {
        if (verbose) {
          logger(`   Testing ${fullUrl}`, "purple")
        }
        const html = await fetchHtmlWithPuppeteer(fullUrl, headless)
        const $ = load(html)
        const text = $('body').text()

        for (const indicator of sqlErrorIndicators) {
          if (text.includes(indicator)) {
            if (verbose) {
              logger(
                ` 🚨 Possible SQL injection detected! Parameter: "${input}" with payload: "${payload}"`,
                "pink"
              )
            }
            return [url, input, payload]
          }
        }
      } catch (error) {
        logger(` 😭 Error testing ${fullUrl} parameter "${input}" with payload "${payload}": \n ${error}`, "red")
      }
    }
  }
  logger(`    ⛔ No forms found and on ${url}`, "orange") 
  return null
}