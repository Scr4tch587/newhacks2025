import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
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

export async function getBusinessTransactions(uid) {
  if (!uid) return []
  // Accept optional idToken via second argument in case caller wants to pass auth header
  const args = Array.from(arguments)
  const idToken = args.length > 1 ? args[1] : null
  const config = { params: { identifier: uid } }
  if (idToken) {
    config.headers = { Authorization: `Bearer ${idToken}` }
  }
  const { data } = await api.get('/businesses/transactions', config)
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

export async function updateItemDetails({ qr_code_id, description, owner_email, file }) {
  // Send multipart/form-data PATCH to /items
  const formData = new FormData()
  formData.append('qr_code_id', qr_code_id)
  formData.append('description', description)
  formData.append('owner_email', owner_email)
  if (file) formData.append('file', file)
  const { data } = await api.patch('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function registerTourist(payload) {
  console.log({ username: payload.username, email: payload.email, password: payload.password })
  const { data } = await api.post('/tourists/register', payload)
  return data
}

export async function registerBusiness(payload) {
  // payload: { name, email, password, address }
  const body = {
    email: payload.email,
    password: payload.password,
    business_name: payload.name,
    address: payload.address,
  }
  const { data } = await api.post('/businesses/register', body)
  return data
}

export async function registerRetailer(payload) {
  // payload: { name, email, password, address }
  const body = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    address: payload.address,
  }
  const { data } = await api.post('/retailers/register', body)
  return data
}

export async function getLoginProfileWithToken(idToken) {
  if (!idToken) return null
  const { data } = await api.get('/login/profile', { headers: { Authorization: `Bearer ${idToken}` } })
  return data
}

export async function getProfileWithToken(idToken) {
  if (!idToken) return null
  const { data } = await api.get('/tourists/profile', { headers: { Authorization: `Bearer ${idToken}` } })
  return data
}

// Retail profiles
export async function getRetailProfilesByEmail(email) {
  if (!email) return []
  const { data } = await api.get('/retailers/profiles', { params: { email } })
  return Array.isArray(data) ? data : []
}

export async function createRetailProfile({ name, description, file }, idToken) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('description', description)
  if (file) formData.append('image', file)
  const headers = { 'Content-Type': 'multipart/form-data' }
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`
  const { data } = await api.post('/retailers/profiles', formData, { headers })
  return data
}

export default api

export async function createItem(form) {
  const formData = new FormData();
  formData.append("name", form.name);
  formData.append("description", form.description);
  formData.append("retailer_email", form.retailer_email);
  if (form.image) formData.append("file", form.image);

  const { data } = await api.post("/retailers/create_item", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return data;
}