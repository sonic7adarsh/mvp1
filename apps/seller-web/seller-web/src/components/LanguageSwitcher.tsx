import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language;
  const isEnglish = currentLang === 'en' || currentLang?.startsWith('en');

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    background: '#F3F4F6',
    borderRadius: '24px',
    padding: '4px',
    position: 'relative',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
    userSelect: 'none',
    width: 'fit-content',
    minWidth: '140px',
  };

  const sliderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    left: '4px',
    bottom: '4px',
    width: 'calc(50% - 4px)',
    background: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    transform: isEnglish ? 'translateX(0)' : 'translateX(100%)',
    zIndex: 1,
  };

  const labelStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative',
    zIndex: 2,
    flex: 1,
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: active ? '#111827' : '#6B7280',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    textAlign: 'center',
    transition: 'color 0.3s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div style={containerStyle}>
      <div style={sliderStyle} />
      <button 
        style={labelStyle(isEnglish)}
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
      >
        English
      </button>
      <button 
        style={labelStyle(!isEnglish)}
        onClick={() => changeLanguage('hi')}
        aria-label="Switch to Hindi"
      >
        हिंदी
      </button>
    </div>
  );
};