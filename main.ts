import { parseArgs } from "jsr:@std/cli/parse-args"
import { scanner } from './tools/scanner.ts'
import getCredentials from "./utils/getCredentials.ts"
import { removeAuthCredentials } from "./utils/removeAuthenticationFiles.ts"
import logger from "./utils/logger.ts"
import getHelp from "./utils/getHelp.ts"
import banner from "./utils/banner.ts"

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
    banner()
    getHelp()
    Deno.exit(0)
  }

  if (!startUrl || typeof startUrl !== "string" || !args) {
    logger(
      "You must provide a valid URL using the -u flag (example: -u http://example.com)\nFor more information, use the -h flag", 
      "red"
    )
    getHelp()
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
  
  const results = await scanner(
    startUrl, 
    redirect, 
    sqliInit, 
    findForms, 
    paramSQLIScan, 
    crawl, 
    headless, 
    verbose
  ) 

  if(results && outputToFile){
    Deno.writeFileSync("./results.json", new TextEncoder().encode(JSON.stringify(results, null, 2)), { append: false })
    logger("Results saved to results.json", "orange")
  }

  removeAuthCredentials()

  logger("\n")
  logger("Done!", "orange")
  logger("\n")
  
}

main()