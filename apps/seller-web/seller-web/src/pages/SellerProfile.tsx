import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'
import { apiFetch } from '../api/client'
import { User, MapPin, Store, LogOut, Edit2, Check, X, Phone, Mail } from 'lucide-react'
import MapSelector from '../components/MapSelector'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export default function SellerProfile() {
  const { t } = useTranslation()
  const { jwt, logout } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  // const [storeId, setStoreId] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  
  const [formData, setFormData] = useState({
    ownerName: '',
    storeName: '',
    storeCategory: 'Grocery', // Default
    shopNo: '',
    building: '',
    street: '',
    area: '',
    city: '',
    pincode: '',
    lat: 28.6139,
    lng: 77.2090
  })

  useEffect(() => {
    if (jwt) fetchProfile()
  }, [jwt])

  const fetchProfile = async () => {
    try {
      // Use GET /api/seller/store as per new alignment
      let res: any = null
      // let sId = ''
      
      try {
        res = await apiFetch<any>('/api/seller/store', {}, { jwt })
        // sId = res.id
      } catch (e) {
        console.error('Failed to fetch store details from /api/seller/store', e)
        // Fallback
        const storesRes = await apiFetch<any>('/api/seller/stores', {}, { jwt })
        const stores = storesRes.stores || (Array.isArray(storesRes) ? storesRes : [])
        if (stores.length > 0) {
            const firstStore = stores[0]
            // sId = firstStore.id
            res = firstStore
        }
      }

      if (res) {
          // Normalize profile data to handle backend variations
          const normalizedProfile = {
            ...res,
            store_name: res.store_name || res.name,
            phone: res.phone || res.ownerPhone,
            address: res.address || {
                shopNo: res.shopNo,
                building: res.building,
                street: res.street,
                area: res.area,
                city: res.city,
                pincode: res.pincode,
                lat: res.lat,
                lng: res.lng,
                full: res.address
            }
          }
          setProfile(normalizedProfile)
          // setStoreId(sId)
          setIsStoreOpen(res.isOpen ?? (res.status === 'open'))
          const addr = normalizedProfile.address || {}
          setFormData({
            ownerName: res.ownerName || res.name || '', // Assuming ownerName is returned or store name is used
            storeName: res.name || '',
            storeCategory: res.category || 'Grocery',
            shopNo: addr.shopNo || '',
            building: addr.building || '',
            street: addr.street || '',
            area: addr.area || '',
            city: addr.city || '',
            pincode: addr.pincode || '',
            lat: addr.lat || 28.6139,
            lng: addr.lng || 77.2090
          })
      }
    } catch (e) {
      console.error('Failed to fetch profile', e)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.hash = '/login'
  }

  const toggleStoreStatus = async () => {
    const oldStatus = isStoreOpen
    const newStatus = !oldStatus
    setIsStoreOpen(newStatus) // Optimistic update

    try {
        // Use PATCH /api/seller/store for status toggle
            await apiFetch('/api/seller/store', {
                method: 'PATCH',
                body: JSON.stringify({ isOpen: newStatus })
            }, { jwt })
            showToast(newStatus ? t('profile_messages.store_open') : t('profile_messages.store_closed'), 'success')
    } catch (e) {
        console.error('Failed to toggle store status', e)
        setIsStoreOpen(oldStatus) // Revert on failure
        showToast(t('profile_messages.status_update_failed'), 'error')
    }
  }
  
  const handleSave = async () => {
    if (!formData.ownerName || !formData.storeName || !formData.shopNo || !formData.building || !formData.city || !formData.pincode) {
        showToast(t('profile_messages.fill_mandatory'), 'error')
        return
    }
    
    // Reconstruct full address string for backward compatibility
    const fullAddress = `${formData.shopNo}, ${formData.building}, ${formData.street ? formData.street + ', ' : ''}${formData.area}, ${formData.city} - ${formData.pincode}`

    setLoading(true)
    try {
        // Use PATCH /api/seller/store for details update
        const res = await apiFetch('/api/seller/store', {
            method: 'PATCH',
            body: JSON.stringify({
                name: formData.storeName,
                category: formData.storeCategory,
                address: {
                    full: fullAddress,
                    shopNo: formData.shopNo,
                    building: formData.building,
                    street: formData.street,
                    area: formData.area,
                    city: formData.city,
                    pincode: formData.pincode,
                    lat: formData.lat,
                    lng: formData.lng
                }
            })
        }, { jwt })
        
        if (res) {
            setProfile((prev: any) => ({
                ...prev,
                name: (res as any).name || formData.storeName,
                address: (res as any).address || prev.address
            }))
        }
        setIsEditing(false)
        showToast(t('profile_messages.update_success'), 'success')
    } catch (e) {
        console.error('Failed to update profile', e)
        showToast(t('profile_messages.update_failed'), 'error')
    } finally {
        setLoading(false)
    }
  }

  const getFormattedAddress = (addr: any) => {
    if (!addr) return t('profile.address_not_set')
    if (typeof addr === 'string') return addr
    
    const parts = [
      addr.shopNo,
      addr.building,
      addr.street,
      addr.area,
      addr.city,
      addr.pincode
    ].filter(Boolean)
    
    if (parts.length > 0) return parts.join(', ')
    return addr.full || t('profile.address_not_set')
  }

  // Styles
  const pageStyle: React.CSSProperties = {
    paddingBottom: 80,
    background: '#f3f4f6', // Slightly darker bg for better contrast
    minHeight: '100vh',
    padding: '16px'
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: 20,
    overflow: 'hidden'
  }

  const headerCardStyle: React.CSSProperties = {
    ...cardStyle,
    padding: '30px 20px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
    position: 'relative'
  }

  const sectionStyle: React.CSSProperties = {
    ...cardStyle,
    padding: '24px'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: 600,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 500,
    color: '#1F2937',
    lineHeight: 1.5
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', 
    height: 48, 
    borderRadius: 12, 
    border: '1px solid #E5E7EB', 
    padding: '0 16px', 
    fontSize: 15,
    marginBottom: 16,
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    background: '#F9FAFB'
  }

  const iconContainerStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 12,
    background: '#F3E8FF', color: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginRight: 12
  }

  // Toggle Switch Styles
  const toggleTrackStyle = (on: boolean): React.CSSProperties => ({
    width: 48,
    height: 28,
    borderRadius: 14,
    background: on ? '#10B981' : '#E5E7EB',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s ease-in-out'
  })

  const toggleThumbStyle = (on: boolean): React.CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 2,
    left: 2,
    transform: on ? 'translateX(20px)' : 'translateX(0)',
    transition: 'transform 0.2s ease-in-out',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  })

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>{t('profile.title')}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <LanguageSwitcher />
          {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                style={{ 
                    background: '#fff', border: '1px solid #E5E7EB', 
                    color: '#111', cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, 
                    padding: '8px 16px', borderRadius: 999,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                <Edit2 size={16} /> {t('common.edit')}
            </button>
          )}
        </div>
      </div>

      {/* Header / Store Info */}
      <div style={headerCardStyle}>
        <div style={{ 
            width: 88, height: 88, borderRadius: 44,
            background: 'var(--primary)', // Solid primary color
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)',
            fontSize: 32
        }}>
          <Store size={40} strokeWidth={1.5} />
        </div>
        
        {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' }}>
                <input 
                    value={formData.storeName}
                    onChange={e => setFormData({...formData, storeName: e.target.value})}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 600, marginBottom: 0 }}
                    placeholder={t('profile.store_name')}
                />
                <select
                    value={formData.storeCategory}
                    onChange={e => setFormData({...formData, storeCategory: e.target.value})}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 15, width: '80%', height: 40, marginBottom: 0 }}
                >
                    <option value="Grocery">{t('categories.Grocery')}</option>
                    <option value="Medicine">{t('categories.Medicine')}</option>
                    <option value="Stationary">{t('categories.Stationary')}</option>
                    <option value="Service">{t('categories.Service')}</option>
                </select>
            </div>
        ) : (
            <>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#111' }}>
                    {profile?.store_name || t('profile.store_name')}
                </h2>
                <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 8, background: '#F3E8FF', padding: '4px 12px', borderRadius: 12, display: 'inline-block' }}>
                    {t(`categories.${profile?.category || 'Grocery'}`, { defaultValue: profile?.category || 'Grocery' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#6B7280' }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{t('profile.seller_id')}: {profile?.id?.slice(0, 8) || '...'}</span>
                </div>
            </>
        )}
      </div>

      {/* Business Status */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ ...iconContainerStyle, background: isStoreOpen ? '#D1FAE5' : '#F3F4F6', color: isStoreOpen ? '#059669' : '#6B7280' }}>
                    <Store size={20} />
                </div>
                <div>
                    <span style={{ fontWeight: 700, fontSize: 16, display: 'block', color: '#1F2937' }}>{t('profile.open_for_business')}</span>
                    <span style={{ fontSize: 13, color: isStoreOpen ? '#059669' : '#6B7280', fontWeight: 500 }}>
                        {isStoreOpen ? t('profile.store_is_online') : t('profile.store_is_offline')}
                    </span>
                </div>
            </div>
            
            <div 
                style={toggleTrackStyle(isStoreOpen)} 
                onClick={toggleStoreStatus}
            >
                <div style={toggleThumbStyle(isStoreOpen)} />
            </div>
        </div>
      </div>

      {/* Personal Details */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <div style={iconContainerStyle}><User size={20} /></div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('profile.personal_details')}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div>
                <div style={labelStyle}>{t('profile.full_name')}</div>
                {isEditing ? (
                    <input 
                        value={formData.ownerName}
                        onChange={e => setFormData({...formData, ownerName: e.target.value})}
                        style={inputStyle}
                        placeholder={t('profile.enter_full_name')}
                    />
                ) : (
                    <div style={valueStyle}>{profile?.name || t('profile.seller_name_fallback')}</div>
                )}
            </div>
            <div>
                <div style={labelStyle}>{t('profile.phone_number')}</div>
                <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={16} color="#9CA3AF" />
                    {profile?.ownerPhone || profile?.phone || t('profile.no_phone_available')}
                </div>
            </div>
             {profile?.email && (
                <div>
                    <div style={labelStyle}>{t('profile.email_address')}</div>
                    <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={16} color="#9CA3AF" />
                        {profile.email}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Store Address */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <div style={iconContainerStyle}><MapPin size={20} /></div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('profile.store_address')}</span>
        </div>

        {isEditing ? (
            <div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <input 
                            placeholder={t('profile.shop_no')}
                            value={formData.shopNo}
                            onChange={e => setFormData({...formData, shopNo: e.target.value})}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <input 
                            placeholder={t('profile.building')}
                            value={formData.building}
                            onChange={e => setFormData({...formData, building: e.target.value})}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <input 
                    placeholder={t('profile.street')}
                    value={formData.street}
                    onChange={e => setFormData({...formData, street: e.target.value})}
                    style={inputStyle}
                />

                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <input 
                            placeholder={t('profile.area')}
                            value={formData.area}
                            onChange={e => setFormData({...formData, area: e.target.value})}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <input 
                            placeholder={t('profile.city')}
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                            style={inputStyle}
                        />
                    </div>
                </div>
                
                <input 
                    placeholder={t('profile.pincode')}
                    maxLength={6}
                    value={formData.pincode}
                    onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g,'')})}
                    style={inputStyle}
                />

                <div style={{ marginTop: 16 }}>
                    <div style={{ ...labelStyle, marginBottom: 8 }}>{t('profile.update_location')}</div>
                    <MapSelector 
                        initialLat={formData.lat}
                        initialLng={formData.lng}
                        onLocationSelect={(lat, lng) => setFormData({...formData, lat, lng})}
                    />
                </div>
            </div>
        ) : (
            <div style={{ lineHeight: 1.6, color: '#374151', fontSize: 15 }}>
                {getFormattedAddress(profile?.address)}
            </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 24 }}>
        {isEditing ? (
            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => {
                    setIsEditing(false)
                    if (profile) {
                         const addr = profile.address || {}
                         setFormData({
                            ownerName: profile.name || '',
                            storeName: profile.store_name || '',
                            storeCategory: profile.category || 'Grocery',
                            shopNo: addr.shopNo || '',
                            building: addr.building || '',
                            street: addr.street || '',
                            area: addr.area || '',
                            city: addr.city || '',
                            pincode: addr.pincode || '',
                            lat: addr.lat || 28.6139,
                            lng: addr.lng || 77.2090
                          })
                    }
                }} style={{
                    flex: 1, height: 50, borderRadius: 14, border: 'none',
                    background: '#E5E7EB', color: '#374151', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'pointer'
                }}>
                    <X size={20} /> {t('common.cancel')}
                </button>
                <button onClick={handleSave} disabled={loading} style={{
                    flex: 1, height: 50, borderRadius: 14, border: 'none',
                    background: 'var(--primary)', color: '#fff', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    cursor: 'pointer'
                }}>
                    {loading ? t('common.loading') : <><Check size={20} /> {t('common.save')}</>}
                </button>
            </div>
        ) : (
            <button onClick={handleLogout} style={{
                width: '100%', height: 50, borderRadius: 14, border: '1px solid #FECACA',
                background: '#FEF2F2', color: '#DC2626', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer'
            }}>
                <LogOut size={20} />
                {t('common.logout')}
            </button>
        )}
      </div>
    </div>
  )
}
