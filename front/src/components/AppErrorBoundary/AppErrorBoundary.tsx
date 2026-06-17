import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  errorMessage: string | null
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crashed while rendering.', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '32px',
            background: '#191716',
            color: '#ffffff',
          }}
        >
          <section
            style={{
              width: 'min(560px, 100%)',
              display: 'grid',
              gap: '16px',
              padding: '24px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              style={{
                color: '#ffab73',
                fontSize: '0.84rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Front EventFlow
            </span>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>
              Une erreur a bloqué l’affichage
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
              La page a planté pendant le rendu. Recharge la page pour réténter,
              puis regarde le message ci-dessous si le problème revient.
            </p>
            <code
              style={{
                display: 'block',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(0,0,0,0.22)',
                color: '#f4ddd0',
                wordBreak: 'break-word',
              }}
            >
              {this.state.errorMessage ?? 'Erreur inconnue'}
            </code>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                minHeight: '48px',
                width: 'fit-content',
                padding: '0 18px',
                border: 0,
                borderRadius: '12px',
                background: '#ece7e2',
                color: '#201713',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Recharger la page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
