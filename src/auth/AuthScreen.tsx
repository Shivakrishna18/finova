import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'

interface AuthScreenProps {
  onSuccess?: () => void
  onExit?: () => void
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function AuthScreen({ onSuccess, onExit }: AuthScreenProps) {
  const { login, signup, loginAsDemo, loginWithGoogle, isLoading } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [googleNotice, setGoogleNotice] = useState<string | null>(null)

  const validateForm = (): boolean => {
    setErrorMessage(null)
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address format (e.g. name@domain.com).')
      return false
    }

    if (mode === 'signup' && (!name.trim() || name.trim().length < 2)) {
      setErrorMessage('Please enter your full name (at least 2 characters).')
      return false
    }

    if (!password) {
      setErrorMessage('Please enter your password.')
      return false
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setGoogleNotice(null)

    if (mode === 'signin') {
      const res = await login(email, password)
      if (res.success) {
        setSuccessMessage('Authentication verified. Loading your financial intelligence core...')
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 400)
      } else {
        setErrorMessage(res.error || 'Unable to sign in. Please verify your credentials.')
      }
    } else {
      const res = await signup(name, email, password)
      if (res.success) {
        setSuccessMessage('Account established. Entering personalized onboarding setup...')
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 400)
      } else {
        setErrorMessage(res.error || 'Unable to create account. Please try again.')
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    const res = await loginWithGoogle()
    if (!res.success) {
      if (res.configRequired) {
        setGoogleNotice(
          'Firebase Authentication requires VITE_FIREBASE_* configuration. You can configure Firebase environment variables in Settings or instantly explore with the Demo Account below.'
        )
      } else {
        setErrorMessage(res.error || 'Google Sign-In failed.')
      }
    } else {
      setSuccessMessage('Google verification successful. Launching FINOVA...')
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 400)
    }
  }

  const handleDemoLogin = (profile: 'alex' | 'priya' = 'alex') => {
    setErrorMessage(null)
    setGoogleNotice(null)
    setSuccessMessage(
      profile === 'priya'
        ? 'Activating Priya Patel demo environment (Growth profile)...'
        : 'Activating Alex Sharma demo environment (₹1,24,850 balance · Full Twin Context)...'
    )
    setTimeout(() => {
      loginAsDemo(profile)
      if (onSuccess) onSuccess()
    }, 400)
  }

  const handlePrefillDemo = () => {
    setMode('signin')
    setEmail('demo@finova.app')
    setPassword('finova-demo')
    setErrorMessage(null)
    setGoogleNotice(null)
  }

  return (
    <div
      id="finova-auth-screen"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 10%, #0d1730 0%, #060912 55%, #030408 100%)',
        padding: '32px 16px',
        color: '#e2e8f0',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(640px, 92vw)',
          height: '380px',
          background: 'radial-gradient(circle, rgba(82, 216, 255, 0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(45px)',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '2px' }}>
          <div
            id="finova-auth-brand-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: onExit ? 'pointer' : 'default',
              padding: '5px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '12px',
              transition: 'all 150ms ease',
            }}
            onClick={onExit}
            title={onExit ? 'Return to FINOVA overview' : undefined}
          >
            <span
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.14em',
                color: '#ffffff',
              }}
            >
              FINOVA<span style={{ color: '#52d8ff' }}>.</span>
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'IBM Plex Mono', monospace",
                color: '#8998b1',
                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                paddingLeft: '8px',
              }}
            >
              FINANCIAL OS
            </span>
          </div>

          <h1
            id="finova-auth-heading"
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '26px',
              fontWeight: 700,
              color: '#f8fafc',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            Your financial system starts here.
          </h1>
          <p
            id="finova-auth-subheading"
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Create your financial identity and let FINOVA understand your money.
          </p>
        </div>

        {/* Main Authentication Card */}
        <div
          id="finova-auth-card"
          style={{
            background: 'rgba(12, 18, 32, 0.85)',
            border: '1px solid rgba(116, 217, 255, 0.18)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px 22px',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Continue with Google Action */}
          <button
            id="finova-google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9px',
              color: '#f1f5f9',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 150ms ease',
              marginBottom: '16px',
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            }}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          {/* Google Notice Banner if triggered */}
          {googleNotice && (
            <div
              id="finova-google-config-notice"
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#bae6fd',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '16px',
                lineHeight: 1.45,
              }}
            >
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div style={{ flex: 1 }}>
                <span>{googleNotice}</span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('alex')}
                    style={{
                      background: 'none',
                      border: 0,
                      color: '#52d8ff',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Launch Demo Now →
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleNotice(null)}
                    style={{
                      background: 'none',
                      border: 0,
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clean Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'IBM Plex Mono', monospace",
                color: '#64748b',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              OR CONTINUE WITH EMAIL
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Mode Switcher Tabs */}
          <div
            id="finova-auth-mode-tabs"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(5, 8, 16, 0.65)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '18px',
            }}
          >
            <button
              id="finova-signin-tab"
              type="button"
              onClick={() => {
                setMode('signin')
                setErrorMessage(null)
                setSuccessMessage(null)
                setGoogleNotice(null)
              }}
              style={{
                padding: '8px 0',
                border: 0,
                borderRadius: '7px',
                background: mode === 'signin' ? 'rgba(82, 216, 255, 0.14)' : 'transparent',
                color: mode === 'signin' ? '#74d9ff' : '#94a3b8',
                fontWeight: mode === 'signin' ? 600 : 500,
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'all 180ms ease',
                outline: 0,
              }}
            >
              Sign In
            </button>
            <button
              id="finova-signup-tab"
              type="button"
              onClick={() => {
                setMode('signup')
                setErrorMessage(null)
                setSuccessMessage(null)
                setGoogleNotice(null)
              }}
              style={{
                padding: '8px 0',
                border: 0,
                borderRadius: '7px',
                background: mode === 'signup' ? 'rgba(82, 216, 255, 0.14)' : 'transparent',
                color: mode === 'signup' ? '#74d9ff' : '#94a3b8',
                fontWeight: mode === 'signup' ? 600 : 500,
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'all 180ms ease',
                outline: 0,
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              id="finova-auth-error"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div
              id="finova-auth-success"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#86efac',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                lineHeight: 1.4,
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="finova-name-input"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: '#94a3b8',
                    marginBottom: '5px',
                    letterSpacing: '0.04em',
                  }}
                >
                  FULL NAME
                </label>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <User
                    className="w-4 h-4"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#64748b',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="finova-name-input"
                    type="text"
                    placeholder="e.g. Maya Chen"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      background: 'rgba(6, 10, 20, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#52d8ff')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="finova-email-input"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#94a3b8',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                }}
              >
                EMAIL ADDRESS
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Mail
                  className="w-4 h-4"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="finova-email-input"
                  type="email"
                  placeholder={mode === 'signin' ? 'demo@finova.app or name@example.com' : 'name@example.com'}
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    background: 'rgba(6, 10, 20, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#52d8ff')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label
                  htmlFor="finova-password-input"
                  style={{
                    fontSize: '11px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: '#94a3b8',
                    letterSpacing: '0.04em',
                  }}
                >
                  PASSWORD
                </label>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Minimum 6 characters</span>
              </div>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Lock
                  className="w-4 h-4"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="finova-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    background: 'rgba(6, 10, 20, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#52d8ff')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 0,
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 hover:text-slate-200" />
                  ) : (
                    <Eye className="w-4 h-4 hover:text-slate-200" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="finova-auth-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 20px',
                marginTop: '4px',
                background: 'linear-gradient(135deg, #74d9ff 0%, #38bdf8 100%)',
                color: '#06101c',
                border: 0,
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(116, 217, 255, 0.25)',
                opacity: isLoading ? 0.7 : 1,
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: '15px',
                      height: '15px',
                      border: '2px solid rgba(6, 16, 28, 0.3)',
                      borderTopColor: '#06101c',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to FINOVA' : 'Continue to Financial Setup'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '14px',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted local session · Client-isolated financial twin</span>
          </div>
        </div>

        {/* Demo Account Access Area (Judges & Instant Exploration) */}
        <div
          id="finova-demo-access-card"
          style={{
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(116, 217, 255, 0.22)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                Try Demo
              </span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'IBM Plex Mono', monospace",
                background: 'rgba(116, 217, 255, 0.12)',
                color: '#74d9ff',
                padding: '2px 7px',
                borderRadius: '4px',
                fontWeight: 600,
                border: '1px solid rgba(116, 217, 255, 0.25)',
              }}
            >
              JUDGES & PREVIEW
            </span>
          </div>

          <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
            Explore FINOVA with a preloaded financial profile.
          </p>

          {/* Demo Credentials Box */}
          <div
            style={{
              background: 'rgba(5, 8, 16, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '7px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <div style={{ display: 'flex', gap: '14px', color: '#cbd5e1' }}>
              <span>
                <strong style={{ color: '#8998b1' }}>Email:</strong> demo@finova.app
              </span>
              <span>
                <strong style={{ color: '#8998b1' }}>Password:</strong> finova-demo
              </span>
            </div>
            <button
              type="button"
              onClick={handlePrefillDemo}
              title="Click to fill form with demo credentials"
              style={{
                background: 'none',
                border: 0,
                color: '#52d8ff',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Fill Form ↗
            </button>
          </div>

          {/* Quick 1-Click Launch Button */}
          <button
            id="finova-demo-launch-btn"
            type="button"
            onClick={() => handleDemoLogin('alex')}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(116, 217, 255, 0.09)',
              border: '1px solid rgba(116, 217, 255, 0.32)',
              borderRadius: '8px',
              color: '#d6f0ff',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(116, 217, 255, 0.18)'
              e.currentTarget.style.borderColor = 'rgba(116, 217, 255, 0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(116, 217, 255, 0.09)'
              e.currentTarget.style.borderColor = 'rgba(116, 217, 255, 0.32)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(116, 217, 255, 0.25)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#74d9ff',
                }}
              >
                AS
              </span>
              <div style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', color: '#f8fafc', fontWeight: 600 }}>Continue as Demo</span>
                <small style={{ fontSize: '10px', color: '#8998b1', fontWeight: 400 }}>Alex Sharma (₹1,24,850 Balance · 4 Goals · AI Engine)</small>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        {/* Back to landing option if available */}
        {onExit && (
          <button
            id="finova-back-to-landing-btn"
            type="button"
            onClick={onExit}
            style={{
              background: 'none',
              border: 0,
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <span>← Return to FINOVA landing page</span>
          </button>
        )}
      </div>
    </div>
  )
}
