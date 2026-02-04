export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ATTEMPTED'
  | 'COMPLETED'

export type Order = {
  id: string
  status: OrderStatus
  slaDeadline?: string // ISO time
  inventoryOk?: boolean
  sellerContact?: {
    name: string
    phone: string
    address: string
  }
  distance?: number
}

export type Delivery = {
  id: string
  orderId: string
  riderId?: string
  status: DeliveryStatus
  otpRequired?: boolean
}

export type Zone = {
  id: string
  name: string
  code?: string
}