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

export async function deleteBusinessTransaction({ identifier, transactionId, idToken }) {
  if (!identifier || !transactionId) throw new Error('identifier and transactionId are required')
  const config = { params: { identifier } }
  if (idToken) config.headers = { Authorization: `Bearer ${idToken}` }
  const { data } = await api.delete(`/businesses/transactions/${encodeURIComponent(transactionId)}`, config)
  return data
}

export async function getHeldItemsByEmail(email) {
  if (!email) return []
  try {
    const { data } = await api.get(`/businesses/items/${encodeURIComponent(email)}`)
    // Endpoint returns { business_email, items }
    return Array.isArray(data?.items) ? data.items : []
  } catch (e) {
    // If 404 (no items), treat as empty list
    if (e?.response?.status === 404) return []
    throw e
  }
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

export async function updateItemStatus(qr_code_id, status) {
  const { data } = await api.patch('/items/status', { qr_code_id, status })
  return data
}

export async function createBusinessTransaction({ identifier, payload, idToken }) {
  const config = { params: { identifier } }
  if (idToken) config.headers = { Authorization: `Bearer ${idToken}` }
  const { data } = await api.post('/businesses/transactions', payload, config)
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

export async function deleteRetailProfile(storeId, idToken) {
  if (!storeId) throw new Error('storeId is required')
  const headers = {}
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`
  const { data } = await api.delete(`/retailers/profile/${encodeURIComponent(storeId)}`, { headers })
  return data
}

export async function getRetailProfile(storeId) {
  if (!storeId) return null
  const { data } = await api.get(`/retailers/profile/${encodeURIComponent(storeId)}`)
  return data
}

export async function getItemByQr(qrId) {
  if (!qrId) return null
  try {
    const { data } = await api.get(`/items/${encodeURIComponent(qrId)}`)
    return data
  } catch (e) {
    if (e?.response?.status === 404) return null
    throw e
  }
}

export async function createRetailerItem({ name, description, retailer_email, file, store_id }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('description', description)
  formData.append('retailer_email', retailer_email)
  if (store_id) formData.append('store_id', store_id)
  if (file) formData.append('file', file)
  const { data } = await api.post('/retailers/create_item', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function getRetailProfileItems(storeId) {
  if (!storeId) return []
  const { data } = await api.get(`/retailers/profile/${encodeURIComponent(storeId)}/items`)
  return Array.isArray(data) ? data : []
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

export async function createDonationItem({ name, description, owner_email, file, qr_code_id, donor_uid, donor_email, date, time }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('description', description)
  formData.append('owner_email', owner_email)
  if (file) formData.append('file', file)
  if (qr_code_id) formData.append('qr_code_id', qr_code_id)
  if (donor_uid) formData.append('donor_uid', donor_uid)
  if (donor_email) formData.append('donor_email', donor_email)
  if (date) formData.append('date', date)
  if (time) formData.append('time', time)
  const { data } = await api.post('/items/create', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function getRetailItemByQr(qrId) {
  if (!qrId) return null
  const { data } = await api.get(`/retailers/item/${encodeURIComponent(qrId)}`)
  return data
}