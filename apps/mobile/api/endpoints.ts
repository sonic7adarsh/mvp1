import type { ApiContext } from './client'
import { apiFetch } from './client'

// Customer
export function getCustomerOrders(ctx: ApiContext) {
  return apiFetch<any[]>('/api/storefront/orders', { method: 'GET' }, ctx)
}
export function cancelCustomerOrder(orderId: string, reason: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/storefront/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }, ctx)
}
export function getCart(ctx: ApiContext) {
  return apiFetch<any>('/api/storefront/cart', { method: 'GET' }, ctx)
}
export function checkout(ctx: ApiContext) {
  return apiFetch<any>('/api/storefront/checkout', { method: 'POST' }, ctx)
}

// Rider
export function getDeliveryById(id: string, ctx: ApiContext) {
  return apiFetch<any>(`/api/logistics/delivery/${id}`, { method: 'GET' }, ctx)
}
export function riderComplete(id: string, otp: string, ctx: ApiContext) {
  return apiFetch<void>(`/api/logistics/delivery/${id}/complete`, { method: 'POST', body: JSON.stringify({ otp }) }, ctx)
}