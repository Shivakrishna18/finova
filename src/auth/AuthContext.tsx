import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  observeAuthState,
} from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/firebase'

export interface UserProfile {
  id: string
  name: string
  email: string
  role?: string
  isDemo?: boolean
  avatarInitials: string
  createdAt: string
  hasCompletedOnboarding?: boolean
  financialPreference?: string
}

export interface AuthContextType {
  user: UserProfile | null
  firebaseUser: FirebaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isFirebaseReady: boolean
  syncStatus: 'synced' | 'syncing' | 'local'
  lastSyncedAt: Date | null
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; configRequired?: boolean }>
  signup: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string; configRequired?: boolean }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; configRequired?: boolean }>
  loginAsDemo: (demoProfile?: 'alex' | 'priya') => void
  logout: () => Promise<void>
  completeOnboarding: (preference?: string) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  triggerManualSync: () => Promise<void>
}

export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'user-demo-alex',
  name: 'Alex Sharma',
  email: 'demo@finova.app',
  role: 'Lead Data Architect',
  isDemo: true,
  avatarInitials: 'AS',
  createdAt: '2026-01-15T00:00:00.000Z',
  hasCompletedOnboarding: true,
  financialPreference: 'Understand my finances',
}

export const SECOND_DEMO_USER: UserProfile = {
  id: 'user-demo-priya',
  name: 'Priya Patel',
  email: 'priya.patel@finova.ai',
  role: 'Growth Investor',
  isDemo: true,
  avatarInitials: 'PP',
  createdAt: '2026-02-01T00:00:00.000Z',
  hasCompletedOnboarding: true,
  financialPreference: 'Reach my goals',
}

const DEMO_STORAGE_KEY = 'finova-demo-mode-session'

function getProfileMetaKey(uid: string): string {
  return `finova-profile-meta-${uid}`
}

function loadLocalProfileMeta(uid: string): Partial<UserProfile> | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getProfileMetaKey(uid))
      if (raw) return JSON.parse(raw)
    }
  } catch {
    // Ignore storage parse errors
  }
  return null
}

function saveLocalProfileMeta(uid: string, meta: Partial<UserProfile>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getProfileMetaKey(uid), JSON.stringify(meta))
    }
  } catch {
    // Ignore storage save errors
  }
}

function computeInitials(name: string, fallback: string = 'FN'): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function buildUserProfileFromFirebase(fbUser: FirebaseUser): UserProfile {
  const meta = loadLocalProfileMeta(fbUser.uid) || {}
  const displayName = meta.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Finova User'
  const initials = meta.avatarInitials || computeInitials(displayName)

  return {
    id: fbUser.uid,
    name: displayName,
    email: fbUser.email || '',
    role: meta.role || 'Personal Financial OS',
    isDemo: false,
    avatarInitials: initials,
    createdAt: fbUser.metadata?.creationTime || meta.createdAt || new Date().toISOString(),
    hasCompletedOnboarding: meta.hasCompletedOnboarding ?? false,
    financialPreference: meta.financialPreference,
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Restore demo session if active
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const demoMode = window.localStorage.getItem(DEMO_STORAGE_KEY)
        if (demoMode === 'priya') return SECOND_DEMO_USER
        if (demoMode === 'alex') return DEFAULT_DEMO_USER
      }
    } catch {
      // ignore
    }
    return null
  })

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => new Date())
  const isDemoActiveRef = useRef<boolean>(false)

  // Track if current state is demo
  useEffect(() => {
    isDemoActiveRef.current = Boolean(user?.isDemo)
  }, [user])

  // Listen to Firebase Authentication lifecycle
  useEffect(() => {
    const isConfigured = isFirebaseConfigured()

    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    const unsubscribe = observeAuthState((fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        // Firebase user authenticated
        const profile = buildUserProfileFromFirebase(fbUser)
        setUser(profile)
        // Clear any leftover demo session flag
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(DEMO_STORAGE_KEY)
        }
        setSyncStatus('synced')
        setLastSyncedAt(new Date())
      } else {
        // If not in demo mode, reset user to null
        if (!isDemoActiveRef.current) {
          setUser(prev => (prev?.isDemo ? prev : null))
        }
      }
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = useCallback(
    async (email: string, password?: string): Promise<{ success: boolean; error?: string; configRequired?: boolean }> => {
      setIsLoading(true)
      setSyncStatus('syncing')

      const cleanEmail = email.trim().toLowerCase()

      // Demo login shortcuts for convenience
      if (
        cleanEmail === 'demo@finova.app' ||
        cleanEmail === 'alex.sharma@finova.ai' ||
        cleanEmail === 'demo@finova.ai'
      ) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(DEMO_STORAGE_KEY, 'alex')
        }
        setUser(DEFAULT_DEMO_USER)
        setSyncStatus('synced')
        setLastSyncedAt(new Date())
        setIsLoading(false)
        return { success: true }
      }

      if (cleanEmail === 'priya.patel@finova.ai') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(DEMO_STORAGE_KEY, 'priya')
        }
        setUser(SECOND_DEMO_USER)
        setSyncStatus('synced')
        setLastSyncedAt(new Date())
        setIsLoading(false)
        return { success: true }
      }

      if (!password) {
        setIsLoading(false)
        return { success: false, error: 'Please enter your password.' }
      }

      const result = await signInWithEmail(cleanEmail, password)
      setIsLoading(false)

      if (result.success && result.user) {
        const profile = buildUserProfileFromFirebase(result.user)
        setUser(profile)
        setSyncStatus('synced')
        setLastSyncedAt(new Date())
        return { success: true }
      }

      return {
        success: false,
        error: result.error || 'Failed to sign in. Please check your credentials.',
        configRequired: result.configRequired,
      }
    },
    []
  )

  const signup = useCallback(
    async (name: string, email: string, password?: string): Promise<{ success: boolean; error?: string; configRequired?: boolean }> => {
      setIsLoading(true)
      setSyncStatus('syncing')

      const cleanName = name.trim()
      const cleanEmail = email.trim().toLowerCase()

      if (!cleanName || cleanName.length < 2) {
        setIsLoading(false)
        return { success: false, error: 'Please enter your full name (at least 2 characters).' }
      }

      if (!password || password.length < 6) {
        setIsLoading(false)
        return { success: false, error: 'Password must contain at least 6 characters.' }
      }

      const result = await signUpWithEmail(cleanName, cleanEmail, password)
      setIsLoading(false)

      if (result.success && result.user) {
        const initials = computeInitials(cleanName)
        const newProfile: UserProfile = {
          id: result.user.uid,
          name: cleanName,
          email: cleanEmail,
          isDemo: false,
          avatarInitials: initials,
          createdAt: new Date().toISOString(),
          hasCompletedOnboarding: false,
          role: 'Personal Financial OS',
        }

        // Save initial profile metadata locally keyed by Firebase UID
        saveLocalProfileMeta(result.user.uid, newProfile)

        setUser(newProfile)
        setSyncStatus('synced')
        setLastSyncedAt(new Date())
        return { success: true }
      }

      return {
        success: false,
        error: result.error || 'Failed to create account. Please try again.',
        configRequired: result.configRequired,
      }
    },
    []
  )

  const loginWithGoogle = useCallback(async (): Promise<{
    success: boolean
    error?: string
    configRequired?: boolean
  }> => {
    setIsLoading(true)
    const result = await signInWithGoogle()
    setIsLoading(false)

    if (result.success && result.user) {
      const profile = buildUserProfileFromFirebase(result.user)
      setUser(profile)
      setSyncStatus('synced')
      setLastSyncedAt(new Date())
      return { success: true }
    }

    return {
      success: false,
      error: result.error || 'Google Sign-In failed.',
      configRequired: result.configRequired,
    }
  }, [])

  const loginAsDemo = useCallback(async (profile: 'alex' | 'priya' = 'alex') => {
    // If a Firebase session was active, sign out to isolate demo mode
    await signOutUser()
    const selected = profile === 'priya' ? SECOND_DEMO_USER : DEFAULT_DEMO_USER
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, profile)
    }
    setUser(selected)
    setFirebaseUser(null)
    setSyncStatus('synced')
    setLastSyncedAt(new Date())
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    await signOutUser()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
    }
    setUser(null)
    setFirebaseUser(null)
    setSyncStatus('local')
    setIsLoading(false)
  }, [])

  const completeOnboarding = useCallback((preference?: string) => {
    setUser(prev => {
      if (!prev) return null
      const updated: UserProfile = {
        ...prev,
        hasCompletedOnboarding: true,
        financialPreference: preference || prev.financialPreference,
      }
      if (!prev.isDemo) {
        saveLocalProfileMeta(prev.id, updated)
      }
      return updated
    })
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      if (!prev.isDemo) {
        saveLocalProfileMeta(prev.id, updated)
      }
      return updated
    })
  }, [])

  const triggerManualSync = useCallback(async () => {
    setSyncStatus('syncing')
    await new Promise(r => setTimeout(r, 600))
    setSyncStatus('synced')
    setLastSyncedAt(new Date())
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: user !== null,
        isLoading,
        isFirebaseReady: isFirebaseConfigured(),
        syncStatus,
        lastSyncedAt,
        login,
        signup,
        loginWithGoogle,
        loginAsDemo,
        logout,
        completeOnboarding,
        updateProfile,
        triggerManualSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
