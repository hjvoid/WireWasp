import { payloads, sqlErrorIndicators } from "../templates/basic_sqli.js"
import { extractQueryParams } from "../utils/queryParamsExtractor.ts";
import { ParamSQLInjectionResult } from "../typings/tools/scanner.d.ts";
import process from "node:process";
import logger from "../utils/logger.ts";


export async function paramBasedSQLInjector(url: string, verbose: boolean): Promise<void | ParamSQLInjectionResult[]> {
	const queryParams = extractQueryParams(url);
	
	if (Object.keys(queryParams).length === 0) {
		return undefined;
	}
	
	const cookie = process.env.COOKIE || "myCookie";
	const results: ParamSQLInjectionResult[] = [];

	for (const param in queryParams) {
		for (const payload of payloads) {
			const testUrl = new URL(url);
			testUrl.searchParams.set(param, payload);

			try {
				const response = await fetch(testUrl, {
					method: 'GET',
					headers: {
						'Accept': "application/json",
						'Cookie': cookie,
					},
				})

				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}

				const html = await response.text();

				for (const indicator of sqlErrorIndicators) {
					if (html.includes(indicator)) {
						if (verbose) {
							logger(`   Found SQLI in ${testUrl.toString()} with payload: ${payload} and indicator: ${indicator}`, "pink");
						}
						results.push({
							vulnerableUrl: testUrl.toString(),
							parameter: param,
							payload,
							indicator,
							injectionFound: true
						});
					} else {
						if (verbose) {
							logger(`   No SQLI in ${testUrl.toString()} with payload: ${payload} and indicator: ${indicator}`, "purple");
						}
						results.push({
							vulnerableUrl: testUrl.toString(),
							parameter: param,
							payload,
							indicator
						});
					}
				}
			} catch (e) {
				console.error(e);
			}
		}
	}
	return results;
}

