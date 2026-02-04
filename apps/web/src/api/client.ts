export type ApiContext = { jwt: string }

export type ApiError = {
  status: number
  code?: string
  message?: string
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit,
  _ctx: ApiContext
): Promise<T> {
  const CUSTOMER_TOKEN_KEY = 'customer_token'
  const ctxToken = _ctx?.jwt ? String(_ctx.jwt) : ''
  // Do NOT fallback to localStorage; always trust context token
  const token = ctxToken.trim()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  // Auth only when token exists
  // Never attach Authorization for public endpoints
  const isAuthPath = path.startsWith('/api/auth')
  const isStorefrontPath = path.startsWith('/api/storefront')
  const isStorefrontProtected = path.startsWith('/api/storefront/payments') || 
                               path.startsWith('/api/storefront/checkout') || 
                               path.startsWith('/api/storefront/cart')

  if (token && !isAuthPath && (!isStorefrontPath || isStorefrontProtected)) {
    headers.Authorization = `Bearer ${token}`
  }

  // Use proxy in development to avoid CORS; prefix absolute base in production
  const isDev = !!(import.meta as any).env?.DEV
  const base = isDev ? '' : String((import.meta as any).env?.VITE_API_BASE_URL || '')
  const url = base ? `${base}${path}` : path

  const finalHeaders = { ...headers, ...(options.headers as any) }
  const method = (options && options.method ? options.method : 'GET').toUpperCase()
  const route = typeof window !== 'undefined' ? (window.location.hash || window.location.pathname || '') : ''
  const maskedHeaders = {
    ...finalHeaders,
    ...(finalHeaders.Authorization ? { Authorization: 'Bearer ******' } : {}),
  }
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
  // Mandatory debug log for backend visibility
  console.log('[apiFetch]', method, url)

  if ((import.meta as any).env?.DEV) {
    try {
      let bodyPreview: any = undefined
      if (options && 'body' in options && options.body) {
        const raw = options.body as any
        if (typeof raw === 'string') {
          bodyPreview = raw.length > 200 ? raw.slice(0, 200) + '…' : raw
        } else {
          bodyPreview = '[non-string body]'
        }
      }
      console.log('[api] request', { method, url, headers: maskedHeaders, bodyPreview, route })
    } catch {}
  }

  // Enforce JWT-first for protected APIs
  const isProtected = path.startsWith('/api/orders') || 
                      path.startsWith('/api/cart') || 
                      path.startsWith('/api/customer') ||
                      path.startsWith('/api/storefront/payments') ||
                      path.startsWith('/api/storefront/checkout')

  if (isProtected && !token) {
    // Redirect to login immediately, no error logs
    try { if (typeof window !== 'undefined') localStorage.removeItem(CUSTOMER_TOKEN_KEY) } catch {}
    if (typeof window !== 'undefined') {
      window.location.hash = '#/login'
    }
    const err: ApiError = { status: 401, code: 'UNAUTHENTICATED', message: 'Token required for protected endpoint' }
    throw err
  }

  let resp: Response
  try {
    resp = await fetch(url, {
      ...options,
      headers: finalHeaders,
    })
  } catch (e) {
    if ((import.meta as any).env?.DEV) {
    const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    console.error('[api] network error', { method, url, durationMs: Math.round(dur), error: String(e), route })
    }
    throw e
  }

  if ((import.meta as any).env?.DEV) {
    const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    console.log('[api] response', { method, url, status: resp.status, durationMs: Math.round(dur), route })
  }

  // Global auth expiry handling: intercept 401/403 on protected endpoints
  if (isProtected && (resp.status === 401 || resp.status === 403)) {
    // CEO-level guard: only logout on auth-critical flows
    const isAuthEndpoint = path.startsWith('/api/auth') || 
                          path.startsWith('/api/orders') || 
                          path.startsWith('/api/cart') ||
                          path.startsWith('/api/storefront/payments') ||
                          path.startsWith('/api/storefront/checkout') ||
                          path.startsWith('/api/storefront/cart')
                          
    if (isAuthEndpoint) {
      try { if (typeof window !== 'undefined') localStorage.removeItem(CUSTOMER_TOKEN_KEY) } catch {}
      if (typeof window !== 'undefined') {
        window.location.hash = '#/login'
      }
      const err: ApiError = { status: resp.status, code: 'AUTH_EXPIRED', message: 'Authentication expired' }
      throw err
    }
    // For non-auth-critical reads like /api/orders/{id}, just surface the error without logout
  }

  if (!resp.ok) {
    let code: string | undefined
    try {
      const body = await resp.json()
      code = body?.code || body?.error || body?.message
    } catch {}
    const err: ApiError = { status: resp.status, code, message: code }
    // Do not log console errors for 401/403 (handled above)
    if ((import.meta as any).env?.DEV && resp.status !== 401 && resp.status !== 403) {
      console.error('[api] http error', { method, url, status: resp.status, code, headers: maskedHeaders, route })
    }
    throw err
  }

  // If no body
  if (resp.status === 204) return undefined as unknown as T

  // Defensive JSON parsing: Prevent "Unexpected token <" crash
  const text = await resp.text()
  try {
    // If empty body, return empty object/null based on T? 
    // Usually APIs return {} or [] for empty JSON.
    if (!text || text.trim().length === 0) {
      return {} as T
    }
    return JSON.parse(text) as T
  } catch (err) {
    console.error('[api] Failed to parse JSON response', {
      url,
      status: resp.status,
      preview: text.substring(0, 200), // Log first 200 chars to see if it's HTML
    })
    // Throw a specific error we can catch
    throw new Error(`API returned invalid JSON: ${text.substring(0, 50)}...`)
  }
}

export function handleApiError(err: any): string {
  if (typeof err === 'object' && err && 'status' in err) {
    const e = err as ApiError
    switch (e.status) {
      case 403:
        return 'Forbidden: You do not have access.'
      case 404:
        return 'Not found.'
      case 409:
        return e.code || 'Conflict: Invalid transition or rule violation.'
      case 410:
        return 'Gone: Resource no longer available.'
      default:
        return e.message || `Error ${e.status}`
    }
  }
  return 'Unexpected error'
}