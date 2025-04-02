import { payloads, sqlErrorIndicators } from "../templates/basic_sqli.js"

export async function scanForm(url: string, action: string, method: 'GET' | 'POST', inputs: string[], verbose: boolean): Promise<[string, string, string] | null> {
  const formURL = new URL(action, url).href // Handle relative form actions

  if (verbose) {
    console.log(`%c 🔍 Scanning form at ${formURL} (${method}) with fields: ${inputs.join(', ')}`, "color: yellow")
  }

  for (const param of inputs) {
    if (verbose) {
      console.log(`Testing parameter: ${param}`);
    }

    for await (const payload of payloads) {
      const params: Record<string, string> = {};
      params[param] = payload;

      let fullUrl = formURL;
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (method === 'GET') {
        const queryString = new URLSearchParams(params).toString();
        fullUrl = `${formURL}?${queryString}`;
      } else if (method === 'POST') {
        fetchOptions.body = JSON.stringify(params);
      }

      try {
        const response = await fetch(fullUrl, fetchOptions);
        const bodyText = await response.text();

        const foundSqlError = sqlErrorIndicators.some(indicator =>
          bodyText.toLowerCase().includes(indicator.toLowerCase())
        );

        if (foundSqlError) {
          if (verbose) {
            console.log(
              `%c 🚨 Possible SQL injection detected! Parameter: "${param}" with payload: "${payload}"`,
              "color: pink"
            );
          }
          return [url, param, payload];
        }
      } catch (error) {
        console.error(`😭 Error testing parameter "${param}" with payload "${payload}":`, error)
      }
    }
  }
  return null
}