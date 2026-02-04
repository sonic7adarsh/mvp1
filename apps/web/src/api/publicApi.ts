import axios, { AxiosError } from 'axios'

const proxyTarget = (import.meta as any).env?.VITE_PROXY_TARGET
// In dev, route via Vite proxy to avoid CORS; in other envs, hit backend directly
const API_BASE_URL = proxyTarget ? '' : 'http://localhost:8080'

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function logAxiosError(err: unknown, context: string) {
  const axErr = err as AxiosError
  if (axErr && axErr.response) {
    const { status, data, headers } = axErr.response
    const method = axErr.config?.method
    const url = axErr.config?.url
    // Make backend error clearly visible in console
    console.error(`[publicApi] ${context} http error`, { status, method, url, headers, data })
  } else {
    console.error(`[publicApi] ${context} network error`, err)
  }
}