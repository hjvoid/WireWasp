# WIREWASP

## Wirewasp aims to be a basic spidering and scanning command line interface tool to check for basic SQL injection and XSS vulnerabilities.

# Try It Out

Run OWASP Juice Shop in Docker on port 3000 using the command below:\
`docker run --rm -p 3000:3000 bkimminich/juice-shop`

This should run the container if you have it, or pull+run if you don't. 

You can then test the tool against it using the CLI command:\
`deno run wirewasp -u http://localhost:3000`

TODO:
- Get SQLI working.
- Implemet HeadFUL mode?
- Add intial tests.
- Change Cheerio import in crawler to package.json.
- Is there a way of extracting a curl request with headers and params?
- Sort verbose mode so the output is cleaner.
- The JSON output is also needs sorting - the url should be the primary values, not entries.

**In the middle of adding params extractor for sqliInjector.