import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createRetailerItem, getRetailProfile } from '../utils/FastAPIClient'

export default function CreateRetailItemPage() {
  const { storeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const navProfile = location.state?.profile || null
  const [profile, setProfile] = useState(navProfile)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Load profile from backend if navigation didn't provide it
  useEffect(() => {
    let cancelled = false
    if (profile || !storeId) return
    ;(async () => {
      try {
        const data = await getRetailProfile(storeId)
        if (!cancelled) setProfile(data)
      } catch (e) {
        if (!cancelled) setProfile(null)
      }
    })()
    return () => { cancelled = true }
  }, [storeId, profile])

  // Prefill fields from profile when available
  useEffect(() => {
    if (!profile) return
    setName(profile.store_name || profile.name || '')
    setDescription(profile.description || '')
    setImageUrl(profile.image_url || '')
  }, [profile])

  const onImageChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const valid = ['image/jpeg','image/jpg','image/png','image/webp']
    if (!valid.includes(f.type)) {
      alert('Please upload a JPEG, PNG, or WebP image')
      return
    }
    setFile(f)
  }

  async function fetchImageAsFile(url) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const ext = (blob.type.split('/')[1] || 'jpg')
      return new File([blob], `profile-image.${ext}`, { type: blob.type })
    } catch {
      return null
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!user?.email) {
      setError('Missing account email; please sign in again.')
      return
    }
    if (!name || !description) {
      setError('Please fill in name and description')
      return
    }
    setSubmitting(true)
    try {
      let uploadFile = file
      if (!uploadFile && imageUrl) {
        uploadFile = await fetchImageAsFile(imageUrl)
      }
      const created = await createRetailerItem({
        name,
        description,
        retailer_email: user.email,
        file: uploadFile,
        store_id: storeId,
      })
      setResult(created)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to create item'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Confirmation helpers
  const handleDownloadQR = () => {
    if (!result?.qr_code_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.qr_code_base64}`
    link.download = `${result.qr_code_id || 'item-qr'}.png`
    link.click()
  }

  const handlePrintQR = () => {
    if (!result?.qr_code_base64) return
    const w = window.open('', '_blank', 'width=400,height=500')
    if (!w) return
    const imgSrc = `data:image/png;base64,${result.qr_code_base64}`
    w.document.write(`<!doctype html><html><head><title>Print QR</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <img src="${imgSrc}" style="width:256px;height:256px;object-fit:contain;" />
        <div style="margin-top:12px;font-size:14px;color:#333;">QR Code: ${result.qr_code_id || ''}</div>
      </div>
    </body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {!result ? (
        <>
          <h1 className="text-2xl font-semibold">Create Retail Item</h1>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <form onSubmit={onSubmit} className="bg-white border rounded p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Item name" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded px-3 py-2 min-h-24" placeholder="Describe the item" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              {imageUrl && !file && (
                <div className="mb-2">
                  <img src={imageUrl} alt="Profile" className="w-full h-40 object-cover rounded" />
                  <div className="text-xs text-gray-500 mt-1">Using image from profile. You can upload a new one below.</div>
                </div>
              )}
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={onImageChange} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 rounded border">Cancel</button>
              <button disabled={submitting} type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60">
                {submitting ? 'Creating…' : 'Create Item'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Item Created</h1>
          <div className="bg-white border rounded p-6 space-y-4 text-center">
            <div className="text-sm text-gray-600">QR Code ID</div>
            <div className="text-lg font-mono">{result.qr_code_id}</div>
            {result.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${result.qr_code_base64}`}
                alt="QR Code"
                className="mx-auto w-48 h-48"
              />
            ) : (
              <div className="text-gray-500">QR code image not available.</div>
            )}
            {result.image_url && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Item image</div>
                <img src={result.image_url} alt="Item" className="mx-auto w-40 h-40 object-cover rounded" />
              </div>
            )}
            <div className="flex justify-center gap-2">
              <button onClick={handleDownloadQR} className="px-4 py-2 rounded border">Download QR</button>
              <button onClick={handlePrintQR} className="px-4 py-2 rounded border">Print</button>
              <button onClick={()=>navigate('/retail-dashboard')} className="px-4 py-2 rounded bg-indigo-600 text-white">Done</button>
            </div>
            <div>
              <button
                onClick={() => {
                  // reset form but keep profile prefill
                  setName(profile?.store_name || profile?.name || '')
                  setDescription(profile?.description || '')
                  setFile(null)
                  setResult(null)
                }}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                Create another item from this profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
