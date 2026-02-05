import axios, { AxiosError } from 'axios'

const proxyTarget = (import.meta as any).env?.VITE_PROXY_TARGET
const envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL
const isDev = (import.meta as any).env?.DEV
const API_BASE_URL = isDev ? '' : (envBaseUrl || (proxyTarget ? '' : 'http://localhost:8080'))

export const privateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Always attach auth headers on every request
privateApi.interceptors.request.use((config) => {
  try {
    const token = (typeof window !== 'undefined') ? (window.localStorage.getItem('customer_token') || '') : ''
    config.headers = config.headers || {}
    // Attach auth if present
    if (token && token.trim().length > 0) {
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
    // One-line proof in console
    if ((import.meta as any).env?.DEV) {
      const maskedAuth = (config.headers as any).Authorization ? 'Bearer ******' : undefined
      console.log('[privateApi] outgoing headers:', {
        Authorization: maskedAuth,
      })
    }
  } catch {}
  return config
})

// Handle 401 Unauthorized globally
privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - notify app to logout
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

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
      requestHeaders, // Log request headers to debug auth
      data 
    })
  } else {
    console.error(`[privateApi] ${context} network error`, err)
  }
}