import { parseArgs } from "jsr:@std/cli/parse-args"
import { crawlUrl } from './tools/crawler.ts'
import * as fs from 'node:fs';
// import templates from "./templates";

const args = parseArgs(Deno.args, {
  alias: {
    startUrl: "u",
    followRedirects: "r",
    sqliScan: "s",
    outputToFile: "o",
    verbose: "v",
    help: "h"
  }
})

const startUrl = args.startUrl as keyof typeof String
const followRedirects = args.followRedirects as keyof typeof String
const sqliScan = args.sqliScan as keyof typeof String

async function main() {
  if(args.help){
    console.log(`
      usage: deno run dev -u <baseUrl>
      -h, --help  Show help
      -u, --url   Url e.g. http://example.com 
      -r, --redirects  Follow redirects (default: false)
      -s, --sqli  Scan for SQL injection vulnerabilities (default: false)
      -o, --output  Output to file (default: false)
      -v, --verbose  Verbose output (default: false)
      `)
    Deno.exit(0)
  }
  
  if (!startUrl || typeof startUrl !== "string") {
    console.error(
      `%c You must provide a valid URL (example: http://example.com)`, 
      "color: red"
    )
    Deno.exit(1)
  }

  const redirect = followRedirects ? false : true
  const sqliInit = sqliScan ? true : false
  const outputToFile = args.outputToFile ? true : false
  const verbose = args.verbose ? true : false
  // let results: Array<T> = []

  const results = await crawlUrl(startUrl, true, redirect, sqliInit, verbose) 

  if(results) {
    if (verbose){
      console.log(`\nURLS Found:`)
    }
    results.forEach(result => {
      if (verbose) {
        console.log(`%c   URL: ${result.url}`, "color: yellow")
      }
      if(result.formsFound){
        if (verbose) {
          console.log(`%c     ✅ Found ${result.formsFound.toString()} form(s) on ${result.url}:`, "color: green")
        }
      }else {
        if (verbose) {
          console.log(`%c     ❌ No forms found on ${result.url}`, "color: red")
        }
      }
    })
    if(outputToFile){
      Deno.writeFileSync("./results.json", new TextEncoder().encode(JSON.stringify(results, null, 2)), { append: false })
      console.log(`%c   Results saved to results.json`, "color: green");
    }
  } else {
    console.log(`%c No URLs found`, "color: red")
  }

  console.log("\n");
  console.log(`%c Done!`, "color: orange")
  console.log("\n");
  
}

main()