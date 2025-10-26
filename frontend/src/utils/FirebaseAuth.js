// Minimal Firebase Auth setup
// Env vars expected:
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
// VITE_FIREBASE_APP_ID, VITE_FIREBASE_MESSAGING_SENDER_ID

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

// Guard initialize
let app
let auth
export function getFirebaseAuth() {
  if (!app) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  }
  return auth
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(getFirebaseAuth(), provider)
  return result.user
}

export async function signUpWithEmail(email, password) {
  const auth = getFirebaseAuth()
  const userCred = await createUserWithEmailAndPassword(auth, email, password)
  return userCred.user
}

export async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth()
  const userCred = await signInWithEmailAndPassword(auth, email, password)
  return userCred.user
}

export async function getIdToken() {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) return null
  return await user.getIdToken(/* forceRefresh */ false)
}

export async function signOutUser() {
  await signOut(getFirebaseAuth())
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}
