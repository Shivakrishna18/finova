import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured, getMissingFirebaseConfigKeys } from './firebase'

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  code?: string
  configRequired?: boolean
}

/**
 * Translates Firebase Auth error codes into polished, human-readable user messages.
 * Never exposes actual secret or config values.
 */
export function formatFirebaseAuthError(err: any): string {
  if (!err) return 'An unexpected authentication error occurred.'

  const code = err.code || ''
  const message = err.message || ''

  switch (code) {
    case 'auth/configuration-not-found':
      return 'Firebase Authentication configuration not found. Please ensure the Sign-in Provider (Email/Password or Google) is enabled in your Firebase Console (Authentication > Sign-in method), and verify your Project ID and Auth Domain.'
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Invalid Firebase API Key. Please verify VITE_FIREBASE_API_KEY in your environment configuration.'
    case 'auth/project-not-found':
      return 'Firebase project not found. Please verify VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_AUTH_DOMAIN in your environment configuration.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please create an account or try the demo.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify your credentials and try again.'
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or create an account.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.'
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In was cancelled before completing.'
    case 'auth/popup-blocked':
      return 'Google Sign-In popup was blocked by your browser. Please allow popups for this site and retry.'
    case 'auth/cancelled-popup-request':
      return 'Google Sign-In was cancelled by another active popup.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address using another sign-in provider.'
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Access temporarily restricted due to repeated attempts. Please wait a few moments and try again.'
    case 'auth/unauthorized-domain':
      return 'This application domain is not yet authorized in Firebase Console (Authentication > Settings > Authorized domains).'
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in the Firebase Console (Authentication > Sign-in method).'
    default:
      if (message.includes('API key not valid') || message.includes('invalid-api-key')) {
        return 'Invalid Firebase API Key in environment configuration. Please check your VITE_FIREBASE_API_KEY.'
      }
      if (message.includes('configuration-not-found') || message.includes('CONFIGURATION_NOT_FOUND')) {
        return 'Firebase Authentication configuration not found. Please ensure the Sign-in Provider is enabled in your Firebase Console (Authentication > Sign-in method).'
      }
      return message || 'Authentication failed. Please verify your details and try again.'
  }
}

function getMissingConfigErrorMessage(): string {
  const missing = getMissingFirebaseConfigKeys()
  if (missing.length > 0) {
    return `Firebase configuration is incomplete. Missing variables: ${missing.join(', ')}. Please configure them or explore with the Demo Account.`
  }
  return 'Firebase configuration is incomplete. Please set the required VITE_FIREBASE_* environment variables or explore with the Demo Account.'
}

/**
 * Sign up a new user with Email and Password using Firebase Authentication.
 */
export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      configRequired: true,
      error: getMissingConfigErrorMessage(),
    }
  }

  const auth = getFirebaseAuth()
  if (!auth) {
    return {
      success: false,
      configRequired: true,
      error: 'Firebase Auth is not available. Please verify your Firebase environment variables.',
    }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    
    // Update the Firebase User display name
    if (name.trim() && userCredential.user) {
      try {
        await updateFirebaseProfile(userCredential.user, {
          displayName: name.trim(),
        })
      } catch (profileErr) {
        console.warn('Could not update Firebase user displayName:', profileErr)
      }
    }

    return {
      success: true,
      user: userCredential.user,
    }
  } catch (err: any) {
    return {
      success: false,
      code: err?.code,
      error: formatFirebaseAuthError(err),
    }
  }
}

/**
 * Sign in an existing user with Email and Password using Firebase Authentication.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      configRequired: true,
      error: getMissingConfigErrorMessage(),
    }
  }

  const auth = getFirebaseAuth()
  if (!auth) {
    return {
      success: false,
      configRequired: true,
      error: 'Firebase Auth is not available. Please verify your Firebase environment variables.',
    }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
    return {
      success: true,
      user: userCredential.user,
    }
  } catch (err: any) {
    return {
      success: false,
      code: err?.code,
      error: formatFirebaseAuthError(err),
    }
  }
}

/**
 * Sign in or Sign up using Google OAuth through Firebase Authentication.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      configRequired: true,
      error: getMissingConfigErrorMessage(),
    }
  }

  const auth = getFirebaseAuth()
  if (!auth) {
    return {
      success: false,
      configRequired: true,
      error: 'Firebase Auth is not available. Please verify your Firebase environment variables.',
    }
  }

  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
    })
    
    const result = await signInWithPopup(auth, provider)
    return {
      success: true,
      user: result.user,
    }
  } catch (err: any) {
    return {
      success: false,
      code: err?.code,
      error: formatFirebaseAuthError(err),
    }
  }
}

/**
 * Sign out the currently authenticated user from Firebase.
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  const auth = getFirebaseAuth()
  if (!auth) {
    return { success: true }
  }

  try {
    await signOut(auth)
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: formatFirebaseAuthError(err),
    }
  }
}

/**
 * Attaches a listener to Firebase Auth state changes.
 * Returns an unsubscribe function.
 */
export function observeAuthState(
  callback: (user: User | null) => void
): Unsubscribe {
  const auth = getFirebaseAuth()
  if (!auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(
    auth,
    firebaseUser => {
      callback(firebaseUser)
    },
    error => {
      console.warn('[FINOVA Auth] Auth state listener error:', error)
      callback(null)
    }
  )
}

