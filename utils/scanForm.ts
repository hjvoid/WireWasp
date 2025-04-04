import { payloads, sqlErrorIndicators } from "../templates/basic_sqli.js"

export async function scanForm(url: string, action: string, method: string, inputs: string[], verbose: boolean): Promise<[string, string, string] | null> {

  const formURL = new URL(action, url).href // Handle relative form actions
  const cookieString = await Deno.readTextFile("./cookies.json");
  const cookies = JSON.parse(cookieString);

  if (verbose) {
    console.log(`%c 🔍 Scanning form at ${formURL} (${method}) with fields: ${inputs.join(', ')}`, "color: yellow")
  }

  for (const input of inputs) {
    for await (const payload of payloads) {
      const params: Record<string, string> = {};
      params[input] = payload;

      let fullUrl = formURL;
      const fetchOptions: RequestInit = {
        credentials: "include",
        headers: {
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
              Cookie: cookies.map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join("; "),
          },
          method,
          mode: "cors"
        }
      

      if (method === 'GET') {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");
        fullUrl = `${formURL}?${queryString}`;
        
      } else if (method === 'POST') {
        fetchOptions.body = JSON.stringify(params);
      }

      try {
        if (verbose) {
          console.log(`%c   Testing ${fullUrl}`, "color: purple");
        }
        
        const response = await fetch(fullUrl, fetchOptions);    
        const bodyText = await response.text();

        const foundSqlError = sqlErrorIndicators.some(indicator =>
          bodyText.toLowerCase().includes(indicator.toLowerCase())
        );

        if (foundSqlError) {
          if (verbose) {
            console.log(
              `%c 🚨 Possible SQL injection detected! Parameter: "${input}" with payload: "${payload}"`,
              "color: pink"
            );
          }
          return [url, input, payload];
        }
      } catch (error) {
        console.log(`%c 😭 Error testing ${fullUrl} parameter "${input}" with payload "${payload}": \n ${error}`, "color: red")
      }
    }
  }
  return null
}