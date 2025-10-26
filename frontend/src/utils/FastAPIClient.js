import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
})

export async function getListings() {
  const { data } = await api.get('/listings')
  return data
}

export async function createListing(payload) {
  const { data } = await api.post('/listings', payload)
  return data
}

export async function getUserPoints(uid) {
  const { data } = await api.get(`/users/${uid}/points`)
  return data
}

export async function redeemReward(uid, rewardId) {
  const { data } = await api.post(`/users/${uid}/redeem`, { rewardId })
  return data
}

export async function getNearbyBusinesses(address, limit = 20) {
  if (!address || !address.trim()) return []
  // The backend exposes a dedicated nearby endpoint that returns distance_km and id
  const { data } = await api.get('/businesses/nearby', { params: { address, limit } })
  return data
}

export async function getNearbyItems({ address, lat, lng, limit = 50 } = {}) {
  // Accept either address or lat/lng. Return [] if none provided.
  if ((!address || !address.trim()) && (lat == null || lng == null)) return []
  const params = { limit }
  if (address && address.trim()) params.address = address
  if (lat != null && lng != null) {
    params.lat = lat
    params.lng = lng
  }
  const { data } = await api.get('/items/nearby', { params })
  return data
}

export async function registerTourist(payload) {
  const { data } = await api.post('/tourists/register', payload)
  return data
}

export async function getProfileWithToken(idToken) {
  if (!idToken) return null
  const { data } = await api.get('/login/profile', { headers: { Authorization: `Bearer ${idToken}` } })
  return data
}

export default api
