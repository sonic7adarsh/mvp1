import React, { useState } from 'react'
import { useLocation } from '../context/LocationContext'

export default function SelectLocation() {
  const { setLocation } = useLocation()
  const [manualQuery, setManualQuery] = useState('')

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualQuery.trim()) return

    setLocation({
      label: manualQuery,
      source: 'MANUAL',
      confirmed: true
    })

    window.location.hash = '/home'
  }

  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#FFFFFF',
    padding: '24px 16px',
    maxWidth: '420px',
    margin: '0 auto',
  }

  const headerStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#111827',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    background: '#F3F4F6',
    border: 'none',
    fontSize: '16px',
    marginBottom: '24px',
    boxSizing: 'border-box'
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    background: '#D32F2F',
    color: '#fff',
    border: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>{t('select_location.title')}</div>
      
      <form onSubmit={handleManualSubmit}>
        <input 
          style={inputStyle}
          placeholder={t('select_location.placeholder')}
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" style={buttonStyle}>
          {t('select_location.confirm')}
        </button>
      </form>
      
      <div 
        style={{ marginTop: '20px', textAlign: 'center', color: '#666', cursor: 'pointer' }}
        onClick={() => window.location.hash = '/home'}
      >
        {t('select_location.cancel')}
      </div>
    </div>
  )
}
