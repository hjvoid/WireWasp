export function extractQueryParams(urlString: string): Record<string, string> {
    const url = new URL(urlString);
    const params: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }