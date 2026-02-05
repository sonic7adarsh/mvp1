import type { ApiContext } from './client'
import { apiFetch } from './client'
import { publicApi, logAxiosError } from './publicApi'
import { privateApi, logPrivateAxiosError } from './privateApi'

// Customer
export async function getCustomerOrders(_ctx: ApiContext) {
  try {
    const res = await privateApi.get('/api/customer/orders')
    return res.data as any[]
  } catch (err) {
    logPrivateAxiosError(err, 'get-customer-orders')
    throw err
  }
}

// User Profile & Addresses
export async function getUserProfile() {
  const res = await privateApi.get('/api/user/profile')
  return res.data
}

export async function updateUserProfile(data: { name?: string; alternatePhone?: string }) {
  const res = await privateApi.put('/api/user/profile', data)
  return res.data
}

export async function getUserAddresses() {
  const res = await privateApi.get('/api/user/addresses')
  return res.data
}

export async function addUserAddress(data: any) {
  const res = await privateApi.post('/api/user/addresses', data)
  return res.data
}

export async function updateUserAddress(id: string, data: any) {
  const res = await privateApi.put(`/api/user/addresses/${id}`, data)
  return res.data
}

export async function deleteUserAddress(id: string) {
  const res = await privateApi.delete(`/api/user/addresses/${id}`)
  return res.data
}

// Global Discovery
export function searchGlobal(query: string, lat: number = 0, lng: number = 0, ctx: ApiContext) {
  const qs = new URLSearchParams()
  qs.set('q', query)
  qs.set('lat', String(lat))
  qs.set('lng', String(lng))
  return apiFetch<any>(`/api/search?${qs.toString()}`, { method: 'GET' }, ctx)
}

export function getGlobalCategories(lat: number = 0, lng: number = 0, ctx?: ApiContext) {
  const qs = new URLSearchParams()
  if (lat !== undefined) qs.set('lat', String(lat))
  if (lng !== undefined) qs.set('lng', String(lng))
  
  // Safe context fallback
  const safeCtx = ctx || { jwt: '' }
  
  return apiFetch<any[]>(`/api/categories/global?${qs.toString()}`, { method: 'GET' }, safeCtx)
}

export function getProductsByCategory(categoryId: string, lat: number = 0, lng: number = 0, ctx: ApiContext) {
  const qs = new URLSearchParams()
  qs.set('categoryId', categoryId)
  qs.set('lat', String(lat))
  qs.set('lng', String(lng))
  return apiFetch<any[]>(`/api/products/by-category?${qs.toString()}`, { method: 'GET' }, ctx)
}

export function cancelCustomerOrder(orderId: string, reason: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/storefront/orders/${orderId}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    ctx
  )
}

export function getCart(ctx: ApiContext) {
  return apiFetch<any>('/api/storefront/cart', { method: 'GET' }, ctx)
}

export function initiatePayment(amount: number, currency: string = 'INR', method: string = 'upi', _ctx: ApiContext) {
  return privateApi
    .post('/api/storefront/payments/initiate', { amount, currency, method })
    .then((res) => res.data)
    .catch((err) => {
      logPrivateAxiosError(err, 'initiate-payment')
      throw err
    })
}

export function verifyPayment(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, _ctx: ApiContext) {
  return privateApi
    .post('/api/storefront/payments/verify', payload)
    .then((res) => res.data)
    .catch((err) => {
      logPrivateAxiosError(err, 'verify-payment')
      throw err
    })
}

export function checkout(payload: any, _ctx: ApiContext) {
  return privateApi.post('/api/storefront/checkout', payload)
    .then(res => res.data)
    .catch(err => {
      logPrivateAxiosError(err, 'checkout')
      throw err
    })
}

// Seller
export function getSellerOrders(_ctx: ApiContext) {
  return privateApi
    .get('/api/seller/orders')
    .then((res) => res.data as any[])
    .catch((err) => {
      logPrivateAxiosError(err, 'get-seller-orders')
      throw err
    })
}

export function sellerAccept(id: string, _ctx: ApiContext) {
  return privateApi
    .post(`/api/seller/orders/${id}/accept`)
    .then(() => {})
    .catch((err) => {
      logPrivateAxiosError(err, 'seller-accept')
      throw err
    })
}
export function sellerReject(id: string, reason: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/seller/orders/${id}/reject`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    ctx
  )
}
export function sellerPrepare(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/seller/orders/${id}/prepare`, { method: 'POST' }, ctx)
}
export function sellerReady(id: string, _ctx: ApiContext) {
  return privateApi
    .post(`/api/seller/orders/${id}/ready`)
    .then(() => {})
    .catch((err) => {
      logPrivateAxiosError(err, 'seller-ready')
      throw err
    })
}
export function sellerShip(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/seller/orders/${id}/ship`, { method: 'POST' }, ctx)
}
export function sellerDeliver(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/seller/orders/${id}/deliver`, { method: 'POST' }, ctx)
}
export function sellerCancel(id: string, reason: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/seller/orders/${id}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    ctx
  )
}

// Rider / Logistics
export function getDeliveryById(id: string, ctx: ApiContext) {
  return apiFetch<any>(`/api/logistics/delivery/${id}`, { method: 'GET' }, ctx)
}
export function riderAssign(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/logistics/delivery/${id}/assign`, { method: 'POST' }, ctx)
}
export function riderPickup(id: string, _ctx: ApiContext) {
  return privateApi
    .post(`/api/rider/orders/${id}/pickup`)
    .then(() => {})
    .catch((err) => {
      logPrivateAxiosError(err, 'rider-pickup')
      throw err
    })
}
export function riderOutForDelivery(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/logistics/delivery/${id}/out-for-delivery`, { method: 'POST' }, ctx)
}
export function riderAttempt(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/logistics/delivery/${id}/attempt`, { method: 'POST' }, ctx)
}
export function riderComplete(id: string, _otp: string, _ctx: ApiContext) {
  return privateApi
    .post(`/api/rider/orders/${id}/deliver`)
    .then(() => {})
    .catch((err) => {
      logPrivateAxiosError(err, 'rider-deliver')
      throw err
    })
}

// Admin
export function adminForceCancel(orderId: string, reason: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/admin/orders/${orderId}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    ctx
  )
}
export function adminAssign(deliveryId: string, riderId: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/admin/logistics/assign`,
    { method: 'POST', body: JSON.stringify({ deliveryId, riderId }) },
    ctx
  )
}
export function adminUnassign(deliveryId: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/admin/logistics/unassign`,
    { method: 'POST', body: JSON.stringify({ deliveryId }) },
    ctx
  )
}
export function getZones(ctx: ApiContext) {
  return apiFetch<any[]>(`/api/admin/zones`, { method: 'GET' }, ctx)
}
export function createZone(data: any, ctx: ApiContext) {
  return apiFetch<any>(`/api/admin/zones`, { method: 'POST', body: JSON.stringify(data) }, ctx)
}
export function updateZone(id: string, data: any, ctx: ApiContext) {
  return apiFetch<any>(`/api/admin/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) }, ctx)
}
export function deleteZone(id: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/admin/zones/${id}`, { method: 'DELETE' }, ctx)
}

// Auth and user
export function loginUser(data: { identifier: string; otpOrPassword: string }) {
  // Use configurable login path; default to /api/auth/login
  const path = (import.meta as any).env?.VITE_LOGIN_PATH || '/api/auth/login'
  // Send without JWT
  return apiFetch<{ jwt: string; roles?: string[] }>(
    path,
    { method: 'POST', body: JSON.stringify(data) },
    { jwt: '' }
  )
}

// OTP auth (customer)
export async function sendOtp(phone: string) {
  try {
    await publicApi.post('/api/auth/send-otp', { phone })
  } catch (err) {
    logAxiosError(err, 'send-otp')
    throw err
  }
}

export async function verifyOtp(phone: string, otp: string) {
  try {
    const res = await publicApi.post('/api/auth/verify-otp', { phone, otp })
    return res.data as any
  } catch (err) {
    logAxiosError(err, 'verify-otp')
    throw err
  }
}

export function switchRole(nextRole: string, ctx: ApiContext) {
  return apiFetch<void>(
    `/api/user/switch-role`,
    { method: 'POST', body: JSON.stringify({ role: nextRole }) },
    ctx
  )
}

// Stores and availability
export function getServiceability(
  params: { storeId: string; lat: number; lng: number },
  ctx: ApiContext
) {
  const qs = new URLSearchParams()
  qs.set('storeId', params.storeId)
  qs.set('lat', String(params.lat))
  qs.set('lng', String(params.lng))
  return apiFetch<any>(`/api/storefront/serviceability?${qs.toString()}`, { method: 'GET' }, ctx)
}

export function getStores(lat: number = 0, lng: number = 0, ctx: ApiContext) {
  const qs = new URLSearchParams()
  qs.set('lat', String(lat))
  qs.set('lng', String(lng))
  return apiFetch<any[]>(`/api/storefront/stores?${qs.toString()}`, { method: 'GET' }, ctx)
}

export function getCategories(ctx: ApiContext) {
  return apiFetch<any[]>(`/api/storefront/categories`, { method: 'GET' }, ctx)
}

export function getNearbyStores(ctx: ApiContext) {
  return apiFetch<any[]>(`/api/stores/nearby`, { method: 'GET' }, ctx)
}

// Storefront stores list (customer-facing)
export function getStorefrontStores(ctx: ApiContext) {
  return apiFetch<any[]>(`/api/storefront/stores`, { method: 'GET' }, ctx)
}

export function getAvailability(ctx: ApiContext) {
  return apiFetch<any>(`/api/availability`, { method: 'GET' }, ctx)
}

export function getStoreProducts(storeId: string, ctx: ApiContext) {
  return apiFetch<any[]>(`/api/storefront/stores/${storeId}/products`, { method: 'GET' }, ctx)
}

// Orders (Checkout)
export async function placeOrder(
  items: Array<{ productId: string; quantity: number }>,
  idempotencyKey?: string
) {
  try {
    const res = await privateApi.post(
      '/api/customer/orders',
      { paymentMethod: 'cod', items },
      idempotencyKey ? { headers: { 'X-Idempotency-Key': idempotencyKey } } : undefined
    )
    return res.data as any
  } catch (err) {
    logPrivateAxiosError(err, 'place-order')
    throw err
  }
}

// Orders (MVP v1 - simple payload)
export async function createOrder(items: Array<{ productId: string; quantity: number }>, _ctx: ApiContext) {
  try {
    const res = await privateApi.post('/api/customer/orders', { items, paymentMethod: 'cod' })
    return res.data as any
  } catch (err) {
    logPrivateAxiosError(err, 'create-order')
    throw err
  }
}