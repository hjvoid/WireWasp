/**
 * Discover internal links on a page.
 * @param {cheerio.Root} $ - The Cheerio instance.
 * @param {string} baseUrl - The base URL of the page.
 * @returns {string[]} - A list of internal links.
 */
export function discoverLinks($: cheerio.Root, baseUrl: string): string[] {
    const links: string[] = [];

    $('a[href]').each((index: number, element: any) => {
        let href = $(element).attr('href');
        if (href && !href.startsWith('http')) {
            href = new URL(href, baseUrl).href;
        }

        if (href && href.startsWith(baseUrl) && !href.includes('/redirect?')) {
            links.push(href);
        }
    });

    return Array.from(new Set(links));
}