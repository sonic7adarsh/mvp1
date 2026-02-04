import React from 'react';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';

type State = { hasError: boolean };

class ErrorBoundaryInternal extends React.Component<
  { children: React.ReactNode } & WithTranslation,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[UI Crash]', error);
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center'
        }}>
          <div>
            <h2 style={{ marginBottom: 8 }}>{t('common.something_wrong')}</h2>
            <p style={{ color: '#666' }}>
              {t('common.refresh_page')}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryInternal);
