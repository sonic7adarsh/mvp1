export type ApiError = { status: number; code?: string; message?: string }

function getTenantHeader(): string {
  const tenantEnv = (import.meta as any).env?.VITE_DEFAULT_TENANT
  return tenantEnv && String(tenantEnv).length > 0 ? String(tenantEnv) : ''
}

function authHeader(): string {
  const token = (typeof window !== 'undefined' ? localStorage.getItem('rider_token') || '' : '')
  return token ? `Bearer ${token}` : ''
}

async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const tenant = getTenantHeader()
  const auth = authHeader()
  if (tenant) headers['X-Tenant-Domain'] = tenant
  if (auth) headers['Authorization'] = auth
  const isDev = !!(import.meta as any).env?.DEV
  const base = isDev ? '' : String((import.meta as any).env?.VITE_API_BASE_URL || '')
  const url = base ? `${base}${path}` : path
  const finalHeaders = { ...headers, ...(options.headers as any) }

  const resp = await fetch(url, { ...options, headers: finalHeaders })
  const text = await resp.text()
  let json: any = undefined
  try { json = text ? JSON.parse(text) : undefined } catch {}
  if (!resp.ok) {
    const err: ApiError = { status: resp.status, code: (json && json.code) || undefined, message: (json && json.message) || text }
    throw err
  }
  return json as T
}

export type RiderStatus = 'ONLINE' | 'OFFLINE'
export type AssignedOrder = { deliveryId: string; orderId: string; storeId: string; status: string }

export const riderApi = {
  // Available orders list for HOME
  getAvailableOrders: () =>
    apiFetch<{ orders: any[] }>(
      '/api/rider/orders/available',
      { method: 'GET' }
    ),
  // Rider's own orders list for MY ORDERS
  getMyOrders: () =>
    apiFetch<{ orders: AssignedOrder[] }>(
      '/api/rider/orders/my',
      { method: 'GET' }
    ),
  // Accept an available order
  acceptOrder: async (orderId: string) => {
    try {
      await apiFetch<void>(`/api/rider/orders/${encodeURIComponent(orderId)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch (e: any) {
      if (e && typeof e === 'object' && 'status' in e && e.status === 409) {
        const err: ApiError = { status: 409, message: 'Order already taken' }
        throw err
      }
      throw e
    }
  },
  sendOtp: (phone: string) =>
    apiFetch<any>('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    apiFetch<any>('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    }),
  onboard: (payload: { name: string }) =>
    apiFetch<any>('/api/rider/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateStatus: (status: RiderStatus) =>
    apiFetch<any>('/api/rider/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  // List of assigned deliveries for the rider
  getAssignedDeliveries: () =>
    apiFetch<{ deliveries: AssignedOrder[] }>(
      '/api/rider/orders/assigned',
      { method: 'GET' }
    ),
  // Backward-compatible: return first assigned delivery if present
  getAssignedOrder: async () => {
    const data = await apiFetch<{ deliveries: AssignedOrder[] }>(
      '/api/rider/orders/assigned',
      { method: 'GET' }
    )
    return (data && data.deliveries && data.deliveries[0]) || null
  },
  pickupOrder: (orderId: string) =>
    apiFetch<any>(`/api/rider/orders/${encodeURIComponent(orderId)}/pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
  // Preferred: use deliveryId for pickup
  pickupDelivery: (deliveryId: string) =>
    apiFetch<any>(`/api/rider/orders/${encodeURIComponent(deliveryId)}/pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
  deliverOrder: (orderId: string, otp: string) =>
    apiFetch<any>(`/api/rider/orders/${encodeURIComponent(orderId)}/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    }),
  // Preferred: use deliveryId for deliver
  deliverByDeliveryId: (deliveryId: string, otp: string) =>
    apiFetch<any>(`/api/rider/orders/${encodeURIComponent(deliveryId)}/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    }),
  startDelivery: (orderId: string) =>
    apiFetch<any>(`/api/rider/orders/${encodeURIComponent(orderId)}/start-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
  // Preferred: use deliveryId for start-delivery
  startDeliveryByDeliveryId: (deliveryId: string) =>
    apiFetch<any>(`/api/rider/orders/${encodeURIComponent(deliveryId)}/start-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
  // Orders tab (job board)
  getAvailableOrders: async () => {
    const data = await apiFetch<any>(
      '/api/rider/orders/available',
      { method: 'GET' }
    )
    const deliveries = (data?.deliveries ?? data?.orders ?? []) as any[]
    return { orders: deliveries }
  },
  acceptOrder: async (deliveryId: string) => {
    try {
      await apiFetch<void>(`/api/rider/orders/${encodeURIComponent(deliveryId)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch (e: any) {
      if (e && typeof e === 'object' && 'status' in e && e.status === 409) {
        const err: ApiError = { status: 409, message: 'Order already taken' }
        throw err
      }
      throw e
    }
  },
  // Deliveries tab (accepted + ongoing)
  // Normalize server response to always return { deliveries: Delivery[] }
  getActiveOrders: async () => {
    const data = await apiFetch<any>(
      '/api/rider/orders/active',
      { method: 'GET' }
    )
    const deliveries = (data?.deliveries ?? data?.orders ?? []) as any[]
    return { deliveries }
  },
  getTodayEarnings: () =>
    apiFetch<{ total: number; currency?: string }>(`/api/rider/earnings`, { method: 'GET' }),
  getMe: () =>
    apiFetch<{ active_role?: string; allowed_roles?: string[] }>(`/api/user/me`, { method: 'GET' }),
  getOrderHistory: () =>
    apiFetch<{ orders: any[] }>(`/api/rider/orders/history`, { method: 'GET' }),
}