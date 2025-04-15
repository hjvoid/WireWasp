import logger from "./logger.ts";

export default function getHelp() {
    logger(`
          Usage: deno run wirewasp -u <baseUrl>
          -h, --help  Show help
          -u, --url   url to use URL e.g. -u http://example.com 

          Further options:
            -r, --redirects  Follow redirects (default: false)
            -e, --headless  Turn off headless mode (default: on)
            -c, --crawl Crawl the URL (default: false)
            -s, --sqli  Scan for SQL injection vulnerabilities (default: false)
            -o, --output  Output to file (default: false)
            -v, --verbose  Verbose output (default: false)
            -f, --findForms  Find forms on the page (default: false)
            -p  --paramSQLInjection  Scan for SQL injection vulnerabilities using URL params (default: false)
          `, "orange")
}