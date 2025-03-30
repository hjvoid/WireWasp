import { payloads, sqlErrorIndicators } from "../templates/basic_sqli.js"

/**
 * Scans a webpage for SQLI
 */
export async function scanForSQLi(url: string, verbose: boolean): Promise<[string, string, string] | null> {

  const requests = [
    {
      method: "GET",
      url: url,
      type: "params", // "params", "json", or "form"
    },
    {
      method: "POST",
      url: url,
      type: "json",
      data: {
        username: "admin",
        password: "test",
      },
    },
    {
      method: "POST",
      url: url,
      type: "form",
      data: {
        name: "user",
        message: "hello",
      },
    },
  ]

  for (const request of requests) {
    payloads.forEach(async (payload: string) => {
      if (verbose) {
        console.log(`%c   Testing ${url} ${request.method} for SQLI request with payload: ${payload}`, "color: purple")
      }

      const curlCommand = buildCurlCommand(request, payload);

      const startTime = performance.now();

      const process = new Deno.Command(curlCommand[0], {
        args: curlCommand.slice(1),
        stdout: "piped",
        stderr: "piped",
      });

      const { stdout, stderr } = await process.output();

      const duration = performance.now() - startTime;

      const rawResponse = new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);
      

      const errorMatch = sqlErrorIndicators.some((indicator) =>
        rawResponse.toLowerCase().includes(indicator.toLowerCase())
      );

      const isTimeBasedPayload = payload.toLowerCase().includes("sleep");
      const slowResponse = duration > 4000;

      const vulnerabilityStatus = errorMatch
        ? "🚨 SQL Error Detected"
        : isTimeBasedPayload && slowResponse
        ? "⏱️ Possible Time-Based SQLi"
        : "✅ No injection detected";
      // console.log(`%c     🔎 Result: ${vulnerabilityStatus}`, "color: tangerine");
    })
  }

  return null
}

function buildCurlCommand(request: any, payload: string): string[] {
  const curlCommand: string[] = ["curl", "-s", "-i", "-X", request.method];
  console.log(request);
  
  if (request.method === "POST") {
    if (request.type === "json") {
      const injectedData = injectPayloadIntoData(request.data, payload);
      curlCommand.push("-H", "Content-Type: application/json");
      curlCommand.push("-d", JSON.stringify(injectedData));
    }

    if (request.type === "form") {
      const injectedData = injectPayloadIntoData(request.data, payload);
      const encodedFormData = Object.entries(injectedData)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join("&");

      curlCommand.push("-H", "Content-Type: application/x-www-form-urlencoded");
      curlCommand.push("-d", encodedFormData);
    }
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    for (const [paramKey, paramValue] of url.searchParams.entries()) {
      url.searchParams.set(paramKey, paramValue + payload);
    }
    curlCommand.push(url.toString());
  } else {
    curlCommand.push(request.url);
  }

  return curlCommand;
}

function injectPayloadIntoData(originalData: Record<string, string>, payload: string): Record<string, string> {
  const modifiedData: Record<string, string> = {};
  for (const [key, value] of Object.entries(originalData)) {
    
    modifiedData[key] = value + payload;
  }
  return modifiedData;
}