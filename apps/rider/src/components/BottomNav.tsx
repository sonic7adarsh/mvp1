import React from 'react'

export default function BottomNav({ route }: { route: string }) {
  const navStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 390,
    background: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 10,
  }

  const baseBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B7280',
  }
  const label: React.CSSProperties = { fontSize: 12, marginTop: 2, fontWeight: 600 }
  const icon: React.CSSProperties = { fontSize: 22, lineHeight: 1 }
  const activeBtn: React.CSSProperties = { ...baseBtn, color: '#6C2BD9' }
  const activeLabel: React.CSSProperties = { ...label, fontWeight: 700 }

  const go = (path: string) => { window.location.hash = path }
  const isActive = (path: string) => route === path

  return (
    <nav style={navStyle}>
      <button type="button" style={isActive('/available') ? activeBtn : baseBtn} onClick={() => go('/available')} aria-label="Available">
        <span style={icon}>📍</span>
        <span style={isActive('/available') ? activeLabel : label}>Available</span>
      </button>
      <button type="button" style={isActive('/in-progress') ? activeBtn : baseBtn} onClick={() => go('/in-progress')} aria-label="In-Progress">
        <span style={icon}>🚴</span>
        <span style={isActive('/in-progress') ? activeLabel : label}>In-Progress</span>
      </button>
      <button type="button" style={isActive('/completed') ? activeBtn : baseBtn} onClick={() => go('/completed')} aria-label="Completed">
        <span style={icon}>📦</span>
        <span style={isActive('/completed') ? activeLabel : label}>Completed</span>
      </button>
      <button type="button" style={isActive('/profile') ? activeBtn : baseBtn} onClick={() => go('/profile')} aria-label="Profile">
        <span style={icon}>👤</span>
        <span style={isActive('/profile') ? activeLabel : label}>Profile</span>
      </button>
    </nav>
  )
}