import type { DeliveryStatus, OrderStatus } from './types'

export function canCustomerCancel(status: OrderStatus) {
  // Disabled for READY+
  const invalid = ['READY', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  return !invalid.includes(status)
}

export function canSellerCancel(status: OrderStatus) {
  // only until PREPARING
  return status === 'PLACED' || status === 'ACCEPTED' || status === 'PREPARING'
}

export function canTransitionFrom(status: OrderStatus, target: OrderStatus) {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['PREPARING', 'CANCELLED'],
    REJECTED: [],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  }
  return allowed[status]?.includes(target)
}

export function canRiderUpdate(status: DeliveryStatus, target: DeliveryStatus) {
  const allowed: Record<DeliveryStatus, DeliveryStatus[]> = {
    ASSIGNED: ['PICKED_UP'],
    PICKED_UP: ['OUT_FOR_DELIVERY', 'ATTEMPTED', 'COMPLETED'],
    OUT_FOR_DELIVERY: ['ATTEMPTED', 'COMPLETED'],
    ATTEMPTED: ['OUT_FOR_DELIVERY', 'COMPLETED'],
    COMPLETED: [],
  }
  return allowed[status]?.includes(target)
}