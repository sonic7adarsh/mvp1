export type ApiContext = { jwt: string; tenant: string }

export type ApiError = { status: number; code?: string; message?: string }

export async function apiFetch<T>(path: string, options: RequestInit, ctx: ApiContext): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Domain': ctx.tenant,
    Authorization: `Bearer ${ctx.jwt}`,
  }
  const base = (globalThis as any).EXPO_PUBLIC_API_BASE || ''
  const url = base ? `${base}${path}` : path
  const resp = await fetch(url, { ...options, headers: { ...headers, ...(options.headers as any) } })
  if (!resp.ok) {
    let code: string | undefined
    try {
      const body = await resp.json()
      code = body?.code || body?.error || body?.message
    } catch {}
    const err: ApiError = { status: resp.status, code, message: code }
    throw err
  }
  if (resp.status === 204) return undefined as unknown as T
  return (await resp.json()) as T
}

export function handleApiError(err: any): string {
  if (typeof err === 'object' && err && 'status' in err) {
    const e = err as ApiError
    switch (e.status) {
      case 403:
        return 'Forbidden'
      case 404:
        return 'Not found'
      case 409:
        return e.code || 'Conflict'
      case 410:
        return 'Gone'
      default:
        return e.message || `Error ${e.status}`
    }
  }
  return 'Unexpected error'
}