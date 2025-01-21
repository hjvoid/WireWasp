import { parseArgs } from "jsr:@std/cli/parse-args";
import { crawlUrl } from './tools/crawler.ts';

const args = parseArgs(Deno.args, {
  alias: {
    startUrl: "u",
    help: "h"
  }
})

const startUrl = args.startUrl as keyof typeof String

async function main() {
  if(args.help){
    console.log(`
      usage: deno run dev -u <baseUrl>
      -h, --help  Show help
      -u, --url   Url e.g. http://mycoolur.com 
      `)
    Deno.exit(0)
  }
  if(!startUrl){
    console.error(
      `%c You must provide a valid URL (example: http://probedbyaliens.com)`, 
      "color: red"
    )
    Deno.exit(1)
  }
  const results = await crawlUrl(startUrl, true); // Use Puppeteer for JavaScript-rendered content

  results.forEach(result => {
    console.log(`URL: ${result.url}`);
    result.forms.forEach((form, index) => {
      console.log(`  Form #${index + 1}:`);
      console.log(`    Action: ${form.action}`);
      console.log(`    Method: ${form.method}`);
      console.log(`    Inputs:`);
      form.inputs.forEach(input => {
        console.log(`      - Name: ${input.name}, Type: ${input.type}`);
      });
    });
  });
}

main();