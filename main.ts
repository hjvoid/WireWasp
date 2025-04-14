import { parseArgs } from "jsr:@std/cli/parse-args"
import { scanner } from './tools/scanner.ts'
import getCredentials from "./utils/getCredentials.ts"
import { removeAuthCredentials } from "./utils/removeAuthenticationFiles.ts";
import logger from "./utils/logger.ts";

const args = parseArgs(Deno.args, {
  alias: {
    startUrl: "u",
    followRedirects: "r",
    headless: "e",
    sqliScan: "s",
    verbose: "v",
    findForms: "f",
    paramSQLIScan: "p",
    outputToFile: "o",
    crawl: "c",
    help: "h"
  }
})

const startUrl = args.startUrl as keyof typeof String
const followRedirects = args.followRedirects as keyof typeof String
const sqliScan = args.sqliScan as keyof typeof String

async function main() {
  if(args.help){
    logger(`
      usage: deno run wirewasp -u <baseUrl>
      -h, --help  Show help
      -u, --url   Crawl URL e.g. http://example.com 
      -r, --redirects  Follow redirects (default: false)
      -e, --headless  Turn off headless mode (default: on)
      -c, --crawl Crawl the URL (default: false)
      -s, --sqli  Scan for SQL injection vulnerabilities (default: false)
      -o, --output  Output to file (default: false)
      -v, --verbose  Verbose output (default: false)
      -f, --findForms  Find forms on the page (default: false)
      -p  --paramSQLInjection  Scan for SQL injection vulnerabilities using URL params (default: false)
      `, "orange")
    Deno.exit(0)
  }

  if (!startUrl || typeof startUrl !== "string" || !args) {
    logger(
      "You must provide a valid URL using the -u flag (example: -u http://example.com)", 
      "red"
    )
    Deno.exit(1)
  }

  await getCredentials()

  const redirect = followRedirects ? false : true
  const sqliInit = sqliScan ? true : false
  const outputToFile = args.outputToFile ? true : false
  const verbose = args.verbose ? true : false
  const findForms = args.findForms ? true : false
  const paramSQLIScan = args.paramSQLIScan ? true : false
  const headless = args.headless ? false : true
  const crawl = args.crawl ? true : false
  
  const results = await scanner(startUrl, redirect, sqliInit, findForms, paramSQLIScan, crawl, headless, verbose) 

  if(results && outputToFile){
    Deno.writeFileSync("./results.json", new TextEncoder().encode(JSON.stringify(results, null, 2)), { append: false })
    logger("Results saved to results.json", "orange");
  }

  removeAuthCredentials()

  logger("\n");
  logger("Done!", "orange")
  logger("\n");
  
}

main()