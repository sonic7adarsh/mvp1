export type ApiContext = { jwt: string; tenant: string }

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
  const SELLER_TOKEN_KEY = 'seller_token'
  const token = (typeof window !== 'undefined' ? localStorage.getItem(SELLER_TOKEN_KEY) || '' : '')
  const tenantEnv = (import.meta as any).env?.VITE_DEFAULT_TENANT
  const tenantHeader = tenantEnv && String(tenantEnv).length > 0 ? String(tenantEnv) : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (tenantHeader) headers['X-Tenant-Domain'] = tenantHeader
  if (token) headers.Authorization = `Bearer ${token}`

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

  const isProtected = path.startsWith('/api/seller')
  if (isProtected && !token) {
    try { if (typeof window !== 'undefined') localStorage.removeItem(SELLER_TOKEN_KEY) } catch {}
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

  const text = await resp.text()
  let json: any = undefined
  try { json = text ? JSON.parse(text) : undefined } catch {}
  const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
  if ((import.meta as any).env?.DEV) {
    try {
      console.log('[api] response', { method, url, durationMs: Math.round(dur), status: resp.status, ok: resp.ok })
    } catch {}
  }

  if (!resp.ok) {
    // Clear seller token on auth errors for seller-protected endpoints only
    if (isProtected && (resp.status === 401 || resp.status === 403)) {
      try { if (typeof window !== 'undefined') localStorage.removeItem(SELLER_TOKEN_KEY) } catch {}
      if (typeof window !== 'undefined') window.location.hash = '#/login'
    }
    const err: ApiError = { status: resp.status, message: (json && json.message) || text }
    throw err
  }
  return json as T
}