import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getRetailProfilesByEmail, createRetailProfile } from '../utils/FastAPIClient'

export default function RetailDashboardPage() {
  const { user, role, profile, loading, getIdToken } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState({ name: '', description: '', image: null })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
            {profiles.map((p) => (
              <li key={p.store_id || p.id} className="p-4 flex items-start gap-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded" />
                )}
                <div>
                  <div className="font-medium">{p.store_name || p.name}</div>
                  <div className="text-sm text-gray-600">{p.description}</div>
                </div>
              </li>
            ))}
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
