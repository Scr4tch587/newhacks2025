import React, { createContext, useContext, useEffect, useState } from 'react'
import { getFirebaseAuth, subscribeAuth, getIdToken as firebaseGetIdToken } from '../utils/FirebaseAuth'
import { getLoginProfileWithToken } from '../utils/FastAPIClient'

const AuthContext = createContext({ user: null, role: null, profile: null, loading: true, getIdToken: async () => null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)

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
        setRole(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Fetch role/profile when user changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user) return
      try {
        const token = await firebaseGetIdToken()
        if (!token) return
        const resp = await getLoginProfileWithToken(token)
        if (!cancelled && resp) {
          setRole(resp.role || null)
          setProfile(resp.profile || null)
        }
      } catch (e) {
        if (!cancelled) {
          setRole(null)
          setProfile(null)
        }
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const getIdToken = async () => {
    try {
      return await firebaseGetIdToken()
    } catch (e) {
      console.warn('Failed to get ID token from Firebase', e)
      return null
    }
  }

  const value = { user, role, profile, loading, getIdToken }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
