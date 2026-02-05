import React, { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { MapPin, User, ChevronRight, Plus, Trash2, X, Edit2 } from 'lucide-react'
import { getUserProfile, updateUserProfile, getUserAddresses, addUserAddress, deleteUserAddress } from '../api/endpoints'

type Address = {
  id: string
  name: string
  phone: string
  alternatePhone?: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  type: 'HOME' | 'WORK' | 'OTHER'
  isDefault: boolean
}

type UserProfile = {
  name: string
  phone: string
  alternatePhone?: string
  email?: string
}

export default function Profile() {
  const { t } = useTranslation()
  const { isAuthenticated, logout, userId } = useAuth()
  
  // Data State
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  
  // UI State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showAddressList, setShowAddressList] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  
  // Form State
  const [tempProfile, setTempProfile] = useState({ name: '', alternatePhone: '' })
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    type: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    isDefault: false
  })

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
      loadAddresses()
    }
  }, [isAuthenticated])

  const loadProfile = async () => {
    try {
      const data = await getUserProfile()
      setProfile(data)
      setTempProfile({ name: data.name || '', alternatePhone: data.alternatePhone || '' })
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }

  const loadAddresses = async () => {
    try {
      const data = await getUserAddresses()
      setAddresses(data)
    } catch (err) {
      console.error('Failed to load addresses', err)
    }
  }

  // Save Profile
  const saveProfile = async () => {
    try {
      await updateUserProfile(tempProfile)
      setIsEditingProfile(false)
      loadProfile()
    } catch (err) {
      console.error('Failed to update profile', err)
      alert('Failed to update profile')
    }
  }

  // Address Handlers
  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.line1 || !newAddress.city || !newAddress.zip || !newAddress.phone) {
      alert('Please fill required fields')
      return
    }
    
    try {
      await addUserAddress(newAddress)
      setShowAddAddress(false)
      loadAddresses()
      // Reset form
      setNewAddress({
        name: '', phone: '', alternatePhone: '', line1: '', line2: '',
        city: '', state: '', zip: '', type: 'HOME', isDefault: false
      })
    } catch (err) {
      console.error('Failed to add address', err)
      alert('Failed to add address')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await deleteUserAddress(id)
      loadAddresses()
    } catch (err) {
      console.error('Failed to delete address', err)
    }
  }

  // ... (Keep existing auth check effect)
  useEffect(() => {
    if (isAuthenticated && !userId) {
       logout()
    }
  }, [isAuthenticated, userId, logout])

  if (isAuthenticated && !userId) return null

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100dvh', background: '#F8FAFC',
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, background: '#c9f2f6', borderBottom: '1px solid #A5E0E6',
    height: 56, display: 'flex', alignItems: 'center', padding: '0 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 10, justifyContent: 'space-between'
  }

  // const handleAction = (key: string) => {
  //   if (key === 'my_addresses') setShowAddressList(true)
  // }

  // Modal Styles
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
  }

  const modalContentStyle: React.CSSProperties = {
    background: '#fff', width: '100%', maxWidth: 360, borderRadius: 16, padding: 20,
    maxHeight: '80vh', overflowY: 'auto'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', marginBottom: 12, fontSize: 15
  }

  const btnPrimaryStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 12, background: '#111827',
    color: '#fff', fontWeight: 600, border: 'none', fontSize: 15
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>{t('profile.title')}</h1>
      </header>

      <main className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 80 }}>
        {!isAuthenticated ? (
          // Login View (kept same)
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{t('profile.login_title')}</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '260px', lineHeight: '1.5' }}>{t('profile.login_desc')}</p>
            <button style={{ marginTop: 20, background: '#111827', color: '#FFFFFF', padding: '12px 32px', borderRadius: 12, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={() => window.location.hash = '/login?redirect=/profile'}>{t('profile.login_btn')}</button>
            <div style={{ marginTop: '32px', width: '100%' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><LanguageSwitcher /></div></div>
          </div>
        ) : (
          <>
            {/* User card */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} className="text-gray-400" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.name || (userId ? `User #${userId.substring(0, 6)}` : t('profile.logged_in_user'))}</div>
                  <button onClick={() => { setIsEditingProfile(true) }} style={{ border: 'none', background: 'none', padding: 4 }}>
                    <Edit2 size={14} color="#6B7280" />
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{profile?.phone || 'No phone'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <LanguageSwitcher />
            </div>

            {/* Action list */}
            <div onClick={() => setShowAddressList(true)} style={{ background: '#FFFFFF', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={16} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t('profile.my_addresses')}</div>
                </div>
                <ChevronRight size={18} color="#9CA3AF" />
            </div>
            
            {/* Other static items */}
            {['Payment Methods', 'Help & Support', 'About'].map((label) => (
              <div key={label} style={{ background: '#FFFFFF', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: '#F3F4F6' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                </div>
                <ChevronRight size={18} color="#9CA3AF" />
              </div>
            ))}

            <button type="button" style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: 14, fontWeight: 700, marginTop: 8, cursor: 'pointer', width: '100%', textAlign: 'left', paddingLeft: 16 }} onClick={() => { logout(); window.location.hash = '/login' }}>
              {t('common.logout')}
            </button>
          </>
        )}
      </main>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Edit Profile</h3>
              <X onClick={() => setIsEditingProfile(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name</div>
            <input 
              value={tempProfile.name} 
              onChange={e => setTempProfile({...tempProfile, name: e.target.value})}
              placeholder="Enter your name"
              style={inputStyle}
            />

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Alternate Phone</div>
            <input 
              value={tempProfile.alternatePhone} 
              onChange={e => setTempProfile({...tempProfile, alternatePhone: e.target.value})}
              placeholder="Alternate Phone"
              style={inputStyle}
            />
            
            <button onClick={saveProfile} style={btnPrimaryStyle}>Save</button>
          </div>
        </div>
      )}

      {/* Address List Modal */}
      {showAddressList && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>My Addresses</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowAddAddress(true)} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={18} />
                </button>
                <X onClick={() => setShowAddressList(false)} style={{ cursor: 'pointer' }} />
              </div>
            </div>
            
            {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#6B7280' }}>No saved addresses</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {addresses.map(addr => (
                        <div key={addr.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14 }}>{addr.name}</span>
                                  {addr.isDefault && <span style={{ fontSize: 10, background: '#DEF7EC', color: '#03543F', padding: '2px 6px', borderRadius: 4 }}>Default</span>}
                                  <span style={{ fontSize: 10, background: '#F3F4F6', color: '#374151', padding: '2px 6px', borderRadius: 4 }}>{addr.type}</span>
                                </div>
                                <Trash2 size={16} color="#EF4444" onClick={() => handleDeleteAddress(addr.id)} style={{ cursor: 'pointer' }} />
                            </div>
                            <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.4 }}>
                              {addr.line1}, {addr.line2 ? addr.line2 + ', ' : ''}{addr.city}, {addr.state}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>PIN: {addr.zip} | Ph: {addr.phone}</div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddress && (
        <div style={{ ...modalOverlayStyle, zIndex: 60 }}>
          <div style={modalContentStyle}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Add New Address</h3>
              <X onClick={() => setShowAddAddress(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name (e.g. My Home)</div>
            <input value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} style={inputStyle} />
            
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Phone</div>
            <input value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} style={inputStyle} />

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Address Line 1</div>
            <input value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} style={inputStyle} />
            
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Address Line 2 (Optional)</div>
            <input value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} style={inputStyle} />
            
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>City</div>
                    <input value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>State</div>
                    <input value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} style={inputStyle} />
                </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Zip Code</div>
            <input value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} style={inputStyle} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Address Type</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {['HOME', 'WORK', 'OTHER'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="addressType" 
                      checked={newAddress.type === type} 
                      onChange={() => setNewAddress({...newAddress, type: type as any})} 
                    />
                    <span style={{ fontSize: 14 }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={newAddress.isDefault} 
                onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} 
              />
              <span style={{ fontSize: 14 }}>Make this my default address</span>
            </label>

            <button onClick={handleAddAddress} style={btnPrimaryStyle}>Save Address</button>
          </div>
        </div>
      )}

    </div>
  )
}