import axios, { AxiosResponse } from 'npm:axios@1.7.9'

export async function sendRequest(url: string, params: Record<string, string>): Promise<AxiosResponse> {
    try {
        const response = await axios.get(url, {params})
        return response
    } catch (error) {
        console.error('Request failed:', error)
        throw error
    }
}