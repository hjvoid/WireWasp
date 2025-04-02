import { parseArgs } from "jsr:@std/cli/parse-args"
import { scanner } from './tools/scanner.ts'

const args = parseArgs(Deno.args, {
  alias: {
    startUrl: "u",
    followRedirects: "r",
    sqliScan: "s",
    outputToFile: "o",
    verbose: "v",
    findForms: "f",
    paramSQLIScan: "p",
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
      -u, --url   Crawl URL e.g. http://example.com 
      -r, --redirects  Follow redirects (default: false)
      -s, --sqli  Scan for SQL injection vulnerabilities (default: false)
      -o, --output  Output to file (default: false)
      -v, --verbose  Verbose output (default: false)
      -f, --findForms  Find forms on the page (default: false)
      -p  --paramSQLInjection  Scan for SQL injection vulnerabilities using URL params (default: false)
      `)
    Deno.exit(0)
  }
  
  if (!startUrl || typeof startUrl !== "string" || !args) {
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
  const findForms = args.findForms ? true : false
  const paramSQLIScan = args.paramSQLIScan ? true : false
  
  const results = await scanner(startUrl, redirect, sqliInit, findForms, paramSQLIScan, verbose) 

  if(results && outputToFile){
    Deno.writeFileSync("./results.json", new TextEncoder().encode(JSON.stringify(results, null, 2)), { append: false })
    console.log(`%c   Results saved to results.json`, "color: green");
  }

  console.log("\n");
  console.log(`%c Done!`, "color: orange")
  console.log("\n");
  
}

main()