const ALLOWED = new Set<
  'home_viewed' |
  'store_viewed' |
  'product_added_to_cart' |
  'order_placed' |
  'order_cancelled' |
  'order_reordered'
>([
  'home_viewed',
  'store_viewed',
  'product_added_to_cart',
  'order_placed',
  'order_cancelled',
  'order_reordered',
])

export function track(eventName: string, payload?: Record<string, any>) {
  if (!ALLOWED.has(eventName as any)) return
  try {
    console.log('[TRACK]', eventName, payload)
  } catch {}
}

export type TrackEvent = Parameters<typeof track>[0]