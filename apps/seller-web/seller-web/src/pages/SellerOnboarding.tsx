import { useState } from 'react'
import { apiFetch } from '../api/client'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'
import MapSelector from '../components/MapSelector'
import { Store, MapPin, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export default function SellerOnboarding() {
  const { t } = useTranslation()
  const { jwt } = useAuth()
  const { showToast } = useToast()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    ownerName: '',
    storeName: '',
    shopNo: '',
    building: '',
    street: '',
    area: '',
    city: '',
    pincode: '',
    lat: 28.6139,
    lng: 77.2090
  })

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }))
  }

  const handleSubmit = async () => {
    if (!formData.ownerName || !formData.storeName || !formData.shopNo || !formData.building || !formData.area || !formData.city || !formData.pincode) {
      showToast(t('onboarding.errors.mandatory_fields'), 'error')
      return
    }
    
    const fullAddress = `${formData.shopNo}, ${formData.building}, ${formData.street ? formData.street + ', ' : ''}${formData.area}, ${formData.city} - ${formData.pincode}`

    setLoading(true)
    try {
      // Endpoint: POST /api/seller/store (Alias for onboarding)
      await apiFetch('/api/seller/store', {
        method: 'POST',
        body: JSON.stringify({
          ownerName: formData.ownerName,
          name: formData.storeName,
          category: 'General', // Default category
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
      
      // On success, redirect to dashboard
      window.location.hash = '#/dashboard'
    } catch (e) {
      console.error('Onboarding failed', e)
      showToast(t('onboarding.errors.create_failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 600, margin: '0 auto', padding: 20, minHeight: '100vh', background: '#fff'
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: 32, textAlign: 'center'
  }

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: 24
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', 
    height: 48, 
    borderRadius: 12, 
    border: '1px solid var(--border)', 
    padding: '0 16px', 
    fontSize: 15,
    boxSizing: 'border-box'
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', gap: 16, marginBottom: 16
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%', height: 50, borderRadius: 14, background: 'var(--primary)', color: '#fff', 
    border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
  }

  return (
    <div style={{ padding: 24, paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <LanguageSwitcher />
      </div>
      <div style={headerStyle}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#F3E8FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Store size={32} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('onboarding.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('onboarding.subtitle')}</p>
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('onboarding.full_name')}</label>
        <input 
          type="text"
          placeholder={t('onboarding.placeholders.name')}
          value={formData.ownerName}
          onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
          style={inputStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('onboarding.store_name')}</label>
        <input 
          type="text" 
          placeholder={t('onboarding.placeholders.store')}
          value={formData.storeName}
          onChange={e => setFormData({...formData, storeName: e.target.value})}
          style={inputStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('onboarding.store_address')}</label>
        
        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <input 
              placeholder={t('onboarding.placeholders.shop')}
              value={formData.shopNo}
              onChange={e => setFormData({...formData, shopNo: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input 
              placeholder={t('onboarding.placeholders.building')}
              value={formData.building}
              onChange={e => setFormData({...formData, building: e.target.value})}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input 
            placeholder={t('onboarding.placeholders.street')}
            value={formData.street}
            onChange={e => setFormData({...formData, street: e.target.value})}
            style={inputStyle}
          />
        </div>

        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <input 
              placeholder={t('onboarding.placeholders.area')}
              value={formData.area}
              onChange={e => setFormData({...formData, area: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input 
              placeholder={t('onboarding.placeholders.city')}
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <input 
            placeholder={t('onboarding.placeholders.pincode')}
            type="tel"
            maxLength={6}
            value={formData.pincode}
            onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g,'')})}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('onboarding.map_location')}</label>
        <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={14} /> 
          {t('onboarding.map_hint')}
        </div>
        <MapSelector 
          initialLat={formData.lat} 
          initialLng={formData.lng} 
          onLocationSelect={handleLocationSelect} 
        />
      </div>

      <button onClick={handleSubmit} style={buttonStyle} disabled={loading}>
        {loading ? t('onboarding.creating') : t('onboarding.complete_setup')} <ChevronRight size={20} />
      </button>
    </div>
  )
}
