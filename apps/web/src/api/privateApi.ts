import axios, { AxiosError } from 'axios'

const proxyTarget = (import.meta as any).env?.VITE_PROXY_TARGET
const API_BASE_URL = proxyTarget ? '' : 'http://localhost:8080'
const tenantEnv = (import.meta as any).env?.VITE_DEFAULT_TENANT || 'tenantA'

export const privateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Always attach tenant and auth headers on every request
privateApi.interceptors.request.use((config) => {
  try {
    const token = (typeof window !== 'undefined') ? (window.localStorage.getItem('customer_token') || '') : ''
    config.headers = config.headers || {}
    // Mandatory tenant header
    ;(config.headers as any)['X-Tenant-Domain'] = tenantEnv
    // Attach auth if present
    if (token && token.trim().length > 0) {
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
    // One-line proof in console
    if ((import.meta as any).env?.DEV) {
      const maskedAuth = (config.headers as any).Authorization ? 'Bearer ******' : undefined
      console.log('[privateApi] outgoing headers:', {
        'X-Tenant-Domain': (config.headers as any)['X-Tenant-Domain'],
        Authorization: maskedAuth,
      })
    }
  } catch {}
  return config
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
    const requestHeaders = axErr.config?.headers // Capture request headers
    console.error(`[privateApi] ${context} http error`, { 
      status, 
      method, 
      url, 
      responseHeaders: headers, 
      requestHeaders, // Log request headers to debug auth/tenant
      data 
    })
  } else {
    console.error(`[privateApi] ${context} network error`, err)
  }
}