import React, { createContext, useContext, useEffect, useState } from 'react'
import { getFirebaseAuth, subscribeAuth, getIdToken as firebaseGetIdToken } from '../utils/FirebaseAuth'

const AuthContext = createContext({ user: null, loading: true, getIdToken: async () => null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsub = subscribeAuth((u) => {
      if (u) {
        setUser({
          uid: u.uid,
          displayName: u.displayName || null,
          email: u.email || null,
          photoURL: u.photoURL || null,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const getIdToken = async () => {
    try {
      return await firebaseGetIdToken()
    } catch (e) {
      console.warn('Failed to get ID token from Firebase', e)
      return null
    }
  }

  const value = { user, loading, getIdToken }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
