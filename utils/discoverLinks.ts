import { CheerioAPI } from "npm:cheerio@1.0.0"

export function discoverLinks($: CheerioAPI, baseUrl: string): string[] {
    const base = new URL(baseUrl)
    const foundLinks = new Set<string>()

    $("a[href]").each((_, element) => {
        const href = $(element).attr("href")
        if (!href || href == "/logout" || href.includes("download")) return

        // Skip anchors and JavaScript links
        if (href.startsWith("#") || href.startsWith("javascript:")) return

        try {
            const absoluteUrl = new URL(href, baseUrl).href
            const urlObj = new URL(absoluteUrl)
            if (urlObj.origin === base.origin) {
                foundLinks.add(absoluteUrl)
            }
        } catch {
            // Ignore malformed URLs
        }
    })

    return Array.from(foundLinks)
}