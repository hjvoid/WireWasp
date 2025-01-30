import axios, { AxiosResponse } from 'npm:axios@1.7.9'

/**
 * Sends an HTTP request, handling both GET and POST methods.
 * @param url - The target URL.
 * @param params - The query parameters for GET requests.
 * @param data - The body payload for POST requests.
 * @param method - HTTP method: 'GET' or 'POST'.
 */
export async function sendRequest(
    url: string,
    params: Record<string, string> = {},
    data: Record<string, string> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<AxiosResponse> {
    try {
      const response = await axios({
        method,
        url,
        params: method === 'GET' ? params : {}, 
        data: method === 'POST' ? data : {}, 
        headers: { 'Content-Type': 'application/json' }, // Add cookie / relevant headers?
      })
  
      return response
    } catch (error) {
      console.error(`Request failed: ${error}`)
      throw error
    }
  }