import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getRetailProfilesByEmail, createRetailProfile, deleteRetailProfile, getRetailProfileItems } from '../utils/FastAPIClient'
import { useNavigate } from 'react-router-dom'


export default function RetailDashboardPage() {
  const { user, role, profile, loading, getIdToken } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState({ name: '', description: '', image: null })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()
  const [itemsByStore, setItemsByStore] = useState({})

  
  const email = profile?.email || user?.email || null

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!email) return
      try {
        const list = await getRetailProfilesByEmail(email)
        if (!cancelled) setProfiles(list)
      } catch (e) {
        if (!cancelled) setProfiles([])
      }
    })()
    return () => { cancelled = true }
  }, [email])

  // When profiles load, fetch items for each store_id
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const entries = {}
      for (const p of profiles) {
        const sid = p.store_id || p.id
        if (!sid) continue
        try {
          const items = await getRetailProfileItems(sid)
          if (cancelled) return
          entries[sid] = items
        } catch (e) {
          if (cancelled) return
          entries[sid] = []
        }
      }
      if (!cancelled) setItemsByStore(entries)
    })()
    return () => { cancelled = true }
  }, [profiles])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const valid = ['image/jpeg','image/jpg','image/png','image/webp']
    if (!valid.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image')
      return
    }
    setForm((f) => ({ ...f, image: file }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.name || !form.description) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const token = await getIdToken()
      const resp = await createRetailProfile({ name: form.name, description: form.description, file: form.image }, token)
      // Refresh list
      const list = await getRetailProfilesByEmail(email)
      setProfiles(list)
      setForm({ name: '', description: '', image: null })
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to create retail profile'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteProfile = async (p, e) => {
    // prevent row click navigation
    if (e) e.stopPropagation()
    const storeId = p.store_id || p.id
    if (!storeId) return
    if (!confirm('Delete this retail profile? This cannot be undone.')) return
    try {
      const token = await getIdToken()
      await deleteRetailProfile(storeId, token)
      setProfiles((prev) => prev.filter((x) => (x.store_id || x.id) !== storeId))
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to delete profile'
      setError(msg)
    }
  }

  const handleProfileClick = (profile) => {
    const storeId = profile.store_id || profile.id
    navigate(`/create-item/${storeId}`, { state: { profile } })
  }

  if (loading) return <div className="max-w-5xl mx-auto p-4">Loading…</div>
  if (role !== 'retailer') return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Retail Dashboard</h1>
      <p className="text-gray-600">You must be logged in as a retailer to view this page.</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Retail Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Retail Profiles</h2>
        {profiles.length === 0 ? (
          <p className="text-gray-600">No retail profiles yet.</p>
        ) : (
          <ul className="divide-y border rounded bg-white">
            {profiles.map((p) => {
              const sid = p.store_id || p.id
              const items = itemsByStore[sid] || []
              const preview = items.slice(0, 3)
              return (
                <li
                  key={sid}
                  className="p-4 hover:bg-gray-50 transition"
                >
                  <div 
                    onClick={() => handleProfileClick(p)}
                    className="flex items-start gap-4 cursor-pointer"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{p.store_name || p.name}</div>
                      <div className="text-sm text-gray-600">{p.description}</div>
                    </div>
                    <div className="shrink-0">
                      <button
                        onClick={(e) => onDeleteProfile(p, e)}
                        className="px-2 py-1 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Items created from this profile */}
                  <div className="mt-3 pl-20">
                    <div className="text-xs text-gray-600 mb-1">
                      {items.length === 0 ? 'No items created yet.' : `${items.length} item${items.length>1?'s':''} created from this profile`}
                    </div>
                    {preview.length > 0 && (
                      <div className="flex gap-3">
                        {preview.map((it) => (
                          <div
                            key={it.qr_code_id || it.id}
                            onClick={(e) => { e.stopPropagation(); navigate(`/retail-item/${it.qr_code_id || it.id}`) }}
                            className="flex items-center gap-2 text-xs border rounded px-2 py-1 bg-white cursor-pointer hover:bg-gray-50"
                            title="View QR"
                          >
                            {it.image_url ? (
                              <img src={it.image_url} alt={it.name} className="w-8 h-8 object-cover rounded" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded" />
                            )}
                            <div className="truncate max-w-48" title={it.name}>{it.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Create a Retail Profile</h2>
        {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="bg-white border rounded p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input name="name" value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Profile name" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={onChange} className="w-full border rounded px-3 py-2 min-h-24" placeholder="Describe your profile" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={onImageChange} />
            {form.image && <p className="text-sm text-gray-600 mt-1">Selected: {form.image.name}</p>}
          </div>
          <div className="flex justify-end">
            <button disabled={submitting} type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
              {submitting ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
