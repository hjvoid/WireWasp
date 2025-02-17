import { parseArgs } from "jsr:@std/cli/parse-args"
import { crawlUrl } from './tools/crawler.ts'

const args = parseArgs(Deno.args, {
  alias: {
    startUrl: "u",
    followRedirects: "r",
    sqliScan: "s",
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
  
  const results = await crawlUrl(startUrl, true, redirect, sqliInit) 

  if(results) {
    console.log(`\nURLS Found:`)
    results.forEach(result => {
      console.log(`%c   URL: ${result.url}`, "color: yellow")
      if(result.formsFound){
        console.log(`%c     ✅ Found ${result.formsFound.toString()} form(s) on ${result.url}:`, "color: green")
      }else {
        console.log(`%c     ❌ No forms found on ${result.url}`, "color: red")
      }
    })
  }

  console.log("\n");
  
}

main()