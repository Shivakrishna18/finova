import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

export interface FirebaseConfig {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}

/**
 * Standard Firebase Web App configuration mapped from Vite environment variables.
 * Note: Frontend only uses Web App public client config (never Firebase Admin/service accounts).
 */
export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Returns the names of any missing required Firebase environment variables.
 * Never outputs actual secret or config values.
 */
export function getMissingFirebaseConfigKeys(): string[] {
  const missing: string[] = []
  if (!firebaseConfig.apiKey?.trim()) missing.push('VITE_FIREBASE_API_KEY')
  if (!firebaseConfig.authDomain?.trim()) missing.push('VITE_FIREBASE_AUTH_DOMAIN')
  if (!firebaseConfig.projectId?.trim()) missing.push('VITE_FIREBASE_PROJECT_ID')
  if (!firebaseConfig.appId?.trim()) missing.push('VITE_FIREBASE_APP_ID')
  return missing
}

/**
 * Checks whether all required Firebase configuration variables are provided.
 */
export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseConfigKeys().length === 0
}

let firebaseAppInstance: FirebaseApp | null = null
let firebaseAuthInstance: Auth | null = null

/**
 * Initializes or retrieves the Firebase App instance safely.
 * Returns null if Firebase configuration is missing, preventing undefined calls.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseAppInstance) {
    return firebaseAppInstance
  }

  if (!isFirebaseConfigured()) {
    return null
  }

  try {
    if (getApps().length > 0) {
      firebaseAppInstance = getApp()
    } else {
      firebaseAppInstance = initializeApp({
        apiKey: firebaseConfig.apiKey!.trim(),
        authDomain: firebaseConfig.authDomain!.trim(),
        projectId: firebaseConfig.projectId!.trim(),
        storageBucket: firebaseConfig.storageBucket?.trim() || undefined,
        messagingSenderId: firebaseConfig.messagingSenderId?.trim() || undefined,
        appId: firebaseConfig.appId!.trim(),
      })
    }
    return firebaseAppInstance
  } catch (err) {
    console.warn('[FINOVA Firebase] Initialization warning:', err)
    return null
  }
}

/**
 * Retrieves the Firebase Auth instance safely.
 * Returns null if Firebase is not configured or fails to initialize.
 */
export function getFirebaseAuth(): Auth | null {
  if (firebaseAuthInstance) {
    return firebaseAuthInstance
  }

  const app = getFirebaseApp()
  if (!app) {
    return null
  }

  try {
    firebaseAuthInstance = getAuth(app)
    return firebaseAuthInstance
  } catch (err) {
    console.warn('[FINOVA Firebase Auth] Auth initialization warning:', err)
    return null
  }
}

