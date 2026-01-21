import React from 'react';

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
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
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#666' }}>
              Please refresh the page or try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}