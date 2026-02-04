import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getStyles = () => {
    switch (type) {
      case 'success': return { bg: '#DEF7EC', border: '#84E1BC', text: '#046C4E', icon: <CheckCircle size={20} /> }
      case 'error': return { bg: '#FDE8E8', border: '#F8B4B4', text: '#C81E1E', icon: <AlertCircle size={20} /> }
      default: return { bg: '#E1EFFE', border: '#76A9FA', text: '#1E429F', icon: <Info size={20} /> }
    }
  }

  const style = getStyles()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: style.bg, border: `1px solid ${style.border}`, color: style.text,
      padding: '12px 16px', borderRadius: 8,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: 8, maxWidth: 350, width: '100%',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ flexShrink: 0 }}>{style.icon}</div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{message}</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', padding: 0 }}>
        <X size={16} />
      </button>
    </div>
  )
}
