import React from 'react'

export default function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    padding: 12,
    fontSize: 15,
    outline: 'none',
    boxShadow: 'none',
    textDecoration: 'none',
    WebkitAppearance: 'none' as any,
    appearance: 'none' as any,
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value || ''
    // Strip non-numeric characters and enforce max length 6
    const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 6)
    onChange(cleaned)
  }
  return (
    <input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]{6}"
      minLength={6}
      maxLength={6}
      placeholder="Enter 6-digit OTP"
      value={value}
      onChange={handleChange}
      style={inputStyle}
    />
  )
}