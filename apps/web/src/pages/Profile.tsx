export default function Profile() {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    background: '#F8FAFC',
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    background: '#FFFFFF',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    zIndex: 10,
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    paddingBottom: 80,
  }

  const userCardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 16,
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  }

  const avatarStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: '#F3F4F6',
  }

  const nameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
  }

  const phoneStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#6B7280',
  }

  const rolePillStyle: React.CSSProperties = {
    marginTop: 6,
    alignSelf: 'flex-start',
    background: '#ECFDF5',
    color: '#065F46',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 600,
  }

  const listItemStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  }

  const leftWrapStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const iconPlaceholderStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 4,
    background: '#F3F4F6',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
  }

  const chevronStyle: React.CSSProperties = {
    fontSize: 18,
    color: '#9CA3AF',
  }

  const logoutButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#DC2626',
    fontSize: 14,
    fontWeight: 700,
    marginTop: 8,
    cursor: 'pointer',
  }

  const actions = [
    'My Addresses',
    'Payment Methods',
    'Help & Support',
    'About BharatShop',
  ]

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>Profile</h1>
      </header>

      <main style={mainStyle}>
        {/* User card */}
        <div style={userCardStyle}>
          <div style={avatarStyle} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={nameStyle}>Rahul Sharma</div>
            <div style={phoneStyle}>+91 98XXXX4321</div>
            <div style={rolePillStyle}>Customer</div>
          </div>
        </div>

        {/* Action list */}
        {actions.map((label) => (
          <div key={label} style={listItemStyle} role="button" aria-label={label}>
            <div style={leftWrapStyle}>
              <div style={iconPlaceholderStyle} />
              <div style={labelStyle}>{label}</div>
            </div>
            <div style={chevronStyle}>›</div>
          </div>
        ))}

        {/* Logout button */}
        <button
          type="button"
          style={logoutButtonStyle}
          onClick={() => { window.location.hash = '/login' }}
        >
          Logout
        </button>
      </main>
    </div>
  )
}