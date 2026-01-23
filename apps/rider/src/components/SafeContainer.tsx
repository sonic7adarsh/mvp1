import React from 'react'

type SafeContainerProps = {
  children: React.ReactNode
  center?: boolean
}

export default function SafeContainer({ children, center }: SafeContainerProps) {
  const rootStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    background: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    overflowX: 'hidden',
  }
  const wrapStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 390,
    padding: '16px',
    paddingBottom: 72, // ensure content not hidden behind fixed bottom nav (~56px) with spacing
    display: 'flex',
    flexDirection: 'column',
    ...(center ? { justifyContent: 'center' } : {}),
  }
  return (
    <div style={rootStyle}>
      <div style={wrapStyle}>{children}</div>
    </div>
  )
}