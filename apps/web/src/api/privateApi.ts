import axios, { AxiosError } from 'axios'

const proxyTarget = (import.meta as any).env?.VITE_PROXY_TARGET
const API_BASE_URL = proxyTarget ? '' : 'http://localhost:8080'
const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || 'tenantA'

export const privateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Domain': tenant,
  },
})

export function setPrivateApiAuth(token?: string) {
  if (token && token.trim().length > 0) {
    privateApi.defaults.headers.Authorization = `Bearer ${token}`
  } else {
    delete (privateApi.defaults.headers as any).Authorization
  }
}

export function logPrivateAxiosError(err: unknown, context: string) {
  const axErr = err as AxiosError
  if (axErr && axErr.response) {
    const { status, data, headers } = axErr.response
    const method = axErr.config?.method
    const url = axErr.config?.url
    console.error(`[privateApi] ${context} http error`, { status, method, url, headers, data })
  } else {
    console.error(`[privateApi] ${context} network error`, err)
  }
}