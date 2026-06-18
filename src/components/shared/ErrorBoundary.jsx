import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f5f5f5',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '32px 24px',
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ color: '#e53935', marginTop: 0 }}>页面出错了</h2>
            <pre style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 12,
              color: '#666',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>{this.state.error?.toString()}</pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                background: '#c6613f',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >刷新页面</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
