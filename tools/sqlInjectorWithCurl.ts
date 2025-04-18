import { payloads, sqlErrorIndicators } from "../templates/basic_sqli.js"
import logger from "../utils/logger.ts";

/**
 * Scans a webpage for SQLI
 */
export async function sqlInjectorWithCurl(url: string, verbose: boolean): Promise<[string, string, string] | null> {

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
        logger(`   Testing ${url} ${request.method} for SQLI request with payload: ${payload}`, "purple")
      }

      const curlCommand = buildCurlCommand(request, payload);
      
      const startTime = performance.now();

      const process = new Deno.Command(curlCommand[0], {
        args: curlCommand.slice(1),
        stdout: "piped",
        stderr: "piped",
      });
      console.log(process.output);

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
    })
  }

  return null
}

function buildCurlCommand(request: any, payload: string): string[] {
  const curlCommand: string[] = ["curl", "-s", "-i", "-X", request.method];
  
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
  curlCommand.push("-H", `Authorization: Bearer ${Deno.env.get("AUTH_TOKEN")}`);

  return curlCommand;
}

function injectPayloadIntoData(originalData: Record<string, string>, payload: string): Record<string, string> {
  const modifiedData: Record<string, string> = {};
  for (const [key, value] of Object.entries(originalData)) {
    
    modifiedData[key] = value + payload;
  }
  return modifiedData;
}