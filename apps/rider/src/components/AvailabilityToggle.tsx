import React, { useState } from 'react'
import { riderApi } from '../services/riderApi'
import type { RiderStatus } from '../services/riderApi'
import { useRiderSession } from '../state/riderSession'

export default function AvailabilityToggle() {
  const { availability, setAvailability } = useRiderSession()
  const [loading, setLoading] = useState(false)
  const isOnline = availability === 'ONLINE'

  const onToggle = async () => {
    if (loading) return
    const next: RiderStatus = isOnline ? 'OFFLINE' : 'ONLINE'
    try {
      setLoading(true)
      await riderApi.updateStatus(next)
      setAvailability(next)
    } catch (e) {
      console.error('[AvailabilityToggle] status update failed', e)
    } finally {
      setLoading(false)
    }
  }

  const wrapStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
  const pill: React.CSSProperties = {
    width: 60,
    height: 32,
    borderRadius: 16,
    background: isOnline ? '#DCFCE7' : '#E5E7EB',
    position: 'relative',
    cursor: loading ? 'default' : 'pointer',
    transition: 'background 0.2s ease',
  }
  const knob: React.CSSProperties = {
    position: 'absolute',
    top: 3,
    left: isOnline ? 32 : 3,
    width: 26,
    height: 26,
    borderRadius: 13,
    background: isOnline ? '#16A34A' : '#9CA3AF',
    transition: 'left 0.2s ease, background 0.2s ease',
  }
  const label: React.CSSProperties = { fontSize: 12, color: isOnline ? '#16A34A' : '#6B7280', fontWeight: 700 }

  return (
    <div style={wrapStyle}>
      <div
        style={pill}
        role="switch"
        aria-checked={isOnline}
        aria-label="Availability"
        onClick={onToggle}
      >
        <div style={knob} />
      </div>
      <span style={label}>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  )
}