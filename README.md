# WIREWASP

## Wirewasp aims to be a basic spidering and scanning command line interface tool to check for basic SQL injection and XSS vulnerabilities.

# Try It Out

Run OWASP Juice Shop in Docker on port 3000 using the command below:\
`docker run --rm -p 3000:3000 bkimminich/juice-shop`

This should run the container if you have it, or pull+run if you don't. 

You can then test the tool against it using the CLI command:\
`deno run wirewasp -u http://localhost:3000`

TODO:

- Add intial tests.
- Check ScanForm is actually working. 
- Clean up verbose output in ScanForm 
