export type RiderEventType = 'delivery.ready' | 'delivery.picked_up' | 'delivery.out_for_delivery' | 'delivery.delivered'

export type RiderEvent = { type: RiderEventType; data?: any }

export type Unsubscribe = () => void

export function subscribeToRiderEvents(handler: (evt: RiderEvent) => void): Unsubscribe {
  // Placeholder subscription point. Integrate shared /packages/api ws client here.
  // For scaffold, we attach to window for manual dispatch in dev.
  const onMessage = (e: MessageEvent) => {
    const msg = e.data
    if (msg && typeof msg === 'object' && 'type' in msg) {
      const evt = msg as RiderEvent
      handler(evt)
    }
  }
  window.addEventListener('message', onMessage as any)
  return () => window.removeEventListener('message', onMessage as any)
}