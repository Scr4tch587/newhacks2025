import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { getAvailableTimeSlots, getAvailableDates } from '../utils/DonationAPI'
import { getNearbyBusinesses, createDonationItem, getRetailItemByQr, getRetailProfile, getItemByQr } from '../utils/FastAPIClient'
import passportBg from "../images/passportbackground.jpg"  // 👈 background import
import { useAuth } from '../contexts/AuthContext'

// --- HELPER COMPONENT ---
const PassportField = ({ label, value, isPlaceholder = false }) => (
  <div>
    <p className="text-xs text-red-900 opacity-75 uppercase leading-none">{label}</p>
    <p className={`font-semibold tracking-wide ${isPlaceholder ? 'text-gray-500 italic' : 'text-gray-800'}`}>
      {value}
    </p>
  </div>
)

// --- QR SCANNER COMPONENT ---
const QrCodeScannerComponent = ({ onScanSuccess }) => {
  const html5QrCodeRef = useRef(null)
  const [cameras, setCameras] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const qrboxSize = 200

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices)
        const environmentCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'))
        setSelectedDeviceId(environmentCamera ? environmentCamera.id : devices[0].id)
      }
    }).catch(err => {
      console.error("Error getting cameras:", err)
    })
  }, [])

  useEffect(() => {
    if (!selectedDeviceId || html5QrCodeRef.current) return

    const html5QrCode = new Html5Qrcode("qr-reader")
    html5QrCodeRef.current = html5QrCode

    const config = {
      fps: 10,
      qrbox: { width: qrboxSize, height: qrboxSize },
      aspectRatio: 1.0,
      facingMode: 'environment'
    }

    html5QrCode.start(
      selectedDeviceId,
      config,
      onScanSuccess,
      () => {}
    ).catch((err) => {
      console.error(`Failed to start scanning with device ${selectedDeviceId}.`, err)
    })

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {
          console.warn("Html5Qrcode stop failed:", err)
        })
      }
      html5QrCodeRef.current = null
    }
  }, [selectedDeviceId, onScanSuccess])

  return (
    <div id="qr-reader" className="w-full h-full flex justify-center items-center">
      {!selectedDeviceId && cameras.length === 0 && (
        <div className="text-gray-500 italic text-center p-4">
          Waiting for camera permissions...
        </div>
      )}
      {selectedDeviceId && cameras.length > 1 && (
        <select
          className="absolute top-0 z-50 text-xs p-1 bg-white border rounded"
          value={selectedDeviceId}
          onChange={(e) => {
            html5QrCodeRef.current?.stop().then(() => {
              html5QrCodeRef.current = null
              setSelectedDeviceId(e.target.value)
            })
          }}
        >
          {cameras.map(camera => (
            <option key={camera.id} value={camera.id}>{camera.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}

// --- MAIN PAGE ---
export default function DonateItemPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState('scan')
  const [qrCodeId, setQrCodeId] = useState(null)
  const [productInfo, setProductInfo] = useState(null)
  const [form, setForm] = useState({
    description: '',
    photo: null,
    dropoffLocation: '',
    date: '',
    timeSlot: ''
  })

  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [address, setAddress] = useState('')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [locations, setLocations] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const availableDates = getAvailableDates()

  const handleScanSuccess = useCallback(async (decodedText) => {
    try {
      const extractQrId = (text) => {
        // 1) Try strict JSON
        try {
          const parsed = JSON.parse(text)
          if (parsed && typeof parsed === 'object') {
            return parsed.qr_code_id || parsed.qr || parsed.id || null
          }
        } catch {}
        // 2) Try to parse Python-dict-like string with single quotes or key presence
        const keyed = text.match(/qr_code_id['"]?\s*[:=]\s*['"]([0-9a-fA-F-]{36})['"]/)
        if (keyed && keyed[1]) return keyed[1]
        // 3) Fallback: search for a bare UUID v4 anywhere in the string
        const uuid = text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/)
        if (uuid && uuid[0]) return uuid[0]
        return null
      }

      const qrId = extractQrId(decodedText)
      if (!qrId) throw new Error('Invalid QR content: missing qr_code_id')

      setQrCodeId(qrId)

      // Try resolving from retailer items first (richer link to profile)
      let productName = null
      let itemName = null
      try {
        const retailerResp = await getRetailItemByQr(qrId)
        const retailerItem = retailerResp?.item
        if (retailerItem) {
          itemName = retailerItem.name || null
          const storeId = retailerItem.store_id || null
          if (storeId) {
            const profile = await getRetailProfile(storeId)
            productName = profile?.store_name || profile?.name || itemName || null
          } else {
            productName = itemName
          }
        }
      } catch {}

      // Fallback to general items index
      if (!productName) {
        try {
          const it = await getItemByQr(qrId)
          itemName = it?.name || itemName
          productName = itemName || productName
        } catch {}
      }

      setProductInfo({ productId: qrId, productName: productName || 'Unknown Item' })
      setStep('form')
    } catch (e) {
      console.error('QR scan processing failed', e)
      alert(e?.message || 'Failed to read QR code. Please try again.')
    }
  }, [])

  useEffect(() => {
    if (form.dropoffLocation) {
      getAvailableTimeSlots(form.dropoffLocation).then(setAvailableTimeSlots)
    } else {
      setAvailableTimeSlots([])
    }
  }, [form.dropoffLocation])

  useEffect(() => {
    setSelectedAddress(null)
    if (!address || address.trim().length < 3) {
      setSuggestions([])
      return
    }

    const t = setTimeout(async () => {
      try {
        setSuggestionLoading(true)
        const q = encodeURIComponent(address)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${q}`)
        if (!res.ok) throw new Error('Failed to fetch address suggestions')
        const json = await res.json()
        setSuggestions(Array.isArray(json) ? json : [])
      } catch (e) {
        console.error('Address suggestions failed', e)
        setSuggestions([])
      } finally {
        setSuggestionLoading(false)
      }
    }, 300)

    return () => clearTimeout(t)
  }, [address])

  useEffect(() => {
    if (!selectedAddress) {
      setLocations([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoadingLocations(true)
        const data = await getNearbyBusinesses(selectedAddress.display_name)
        if (!cancelled) setLocations(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed to load nearby businesses', e)
        if (!cancelled) setLocations([])
      } finally {
        if (!cancelled) setLoadingLocations(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedAddress])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleAddressChange = (e) => setAddress(e.target.value)

  const handleSelectSuggestion = (s) => {
    setAddress(s.display_name)
    setSelectedAddress(s)
    setSuggestions([])
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validFormats.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)')
      e.target.value = ''
      return
    }
    setForm(f => ({ ...f, photo: file }))
  }

  // Format location option text: truncate long addresses so distance stays visible
  const formatLocationOption = (loc) => {
    const name = loc?.name || loc?.email || loc?.id || 'Location'
    const addr = String(loc?.address || '')
    const truncated = addr.length > 40 ? addr.slice(0, 40) + '…' : addr
    const distVal = typeof loc?.distance_km === 'number' ? loc.distance_km.toFixed(1) : loc?.distance_km
    const dist = distVal != null && distVal !== '' ? ` (${distVal} km)` : ''
    return `${name} - ${truncated}${dist}`
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.photo || !form.dropoffLocation || !form.date || !form.timeSlot) {
      alert('Please fill in all fields')
      return
    }
    if (!selectedAddress) {
      alert('Please select an address from the suggestions before continuing')
      return
    }
    try {
      const selectedBiz = locations.find((l) => l.id === form.dropoffLocation)
      if (!selectedBiz || !selectedBiz.email) {
        alert('Could not determine selected business email. Please choose a different location.')
        return
      }
      if (!qrCodeId) {
        alert('QR Code is missing. Please go back and rescan the item QR code.')
        return
      }

      // Create a new item document aligned with the scanned QR id
      const name = productInfo?.productName || 'Donated Item'
      await createDonationItem({
        name,
        description: form.description,
        owner_email: selectedBiz.email,
        file: form.photo,
        qr_code_id: qrCodeId,
        donor_uid: user?.uid || null,
        donor_email: user?.email || null,
        date: form.date,
        time: form.timeSlot,
      })

      console.log('Donation update submitted:', { qrCodeId, productInfo, business: selectedBiz.email })
      setStep('success')
    } catch (err) {
      console.error('Failed to submit donation update', err)
      const msg = err?.response?.data?.detail || err?.message || 'Failed to submit donation. Please try again.'
      alert(msg)
    }
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex justify-center items-start p-4"
      style={{ backgroundImage: `url(${passportBg})` }}   // 👈 background applied
    >
      {step === 'scan' && (
        <div className="max-w-xl mx-auto mt-10 p-4">
          <div className="relative bg-red-50/70 border border-red-200 rounded-xl shadow-2xl overflow-hidden p-8 space-y-4 max-w-lg mx-auto">
            <div className="passport-map-bg"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-serif font-bold text-red-800 mb-4 tracking-wider text-center">
                CIRCULARITY PASSPORT
              </h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="shrink-0 w-full md:w-2/5">
                  <div className="w-full aspect-3/4 bg-white border border-gray-400 p-1 shadow-inner relative">
                    <QrCodeScannerComponent onScanSuccess={handleScanSuccess} />
                    <p className="absolute bottom-0 left-0 right-0 text-center text-xs bg-gray-100 py-0.5 text-gray-700 font-mono">
                      QR-SCAN-AREA
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 w-full px-4 py-3 rounded-lg bg-gray-600 text-white font-semibold text-lg hover:bg-gray-700 transition"
                  >
                    If Camera Fails, Try Reloading
                  </button>
                </div>
                <div className="grow md:w-3/5 space-y-2 text-sm">
                  <PassportField label="DOCUMENT TYPE" value="ITEM DONATION" />
                  <PassportField label="ITEM ID" value="AA0000000" isPlaceholder={true} />
                  <h3 className="text-lg font-semibold text-red-700 pt-2 mb-1">SCAN PRODUCT QR CODE</h3>
                  <PassportField label="PRODUCT NAME" value="Awaiting Scan" isPlaceholder={true} />
                  <PassportField label="CONDITION" value="Awaiting Scan" isPlaceholder={true} />
                  <PassportField label="DATE OF SCAN" value={new Date().toLocaleDateString()} />
                  <PassportField label="EXPIRY/TIMEOUT" value="00-00-0000" isPlaceholder={true} />
                  <div className="pt-4">
                    <button
                      onClick={() => navigate(-1)}
                      className="w-full px-4 py-2 rounded border border-red-300 text-red-700 hover:bg-red-100 transition"
                    >
                      Cancel Donation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'form' && (
        <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-xl p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Donate Your Item</h1>
            <p className="text-sm text-gray-600 mt-1">
              Product: <span className="font-medium">{productInfo?.productName}</span>
              {' '}(ID: {productInfo?.productId})
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 min-h-20"
                placeholder="Describe the item's condition, any defects, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Photo *</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              {form.photo && (
                <p className="text-sm text-green-600 mt-1">✓ {form.photo.name}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1">Your Address *</label>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. 123 Main St, Toronto, ON"
                aria-autocomplete="list"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Select an address from the suggestions to enable nearby drop-off locations.</p>
              {suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-auto">
                  {suggestions.map((s) => (
                    <li
                      key={`${s.place_id}`}
                      onClick={() => handleSelectSuggestion(s)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {s.display_name}
                    </li>
                  ))}
                </ul>
              )}
              {suggestionLoading && <div className="text-xs text-gray-500 mt-1">Looking up addresses…</div>}
            </div>

        <div>
          <label className="block text-sm font-medium mb-1">Drop-off Location *</label>
          <select
            name="dropoffLocation"
            value={form.dropoffLocation}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={!selectedAddress}
            required
          >
            <option value="">{selectedAddress ? 'Select a location' : 'Select an address first'}</option>
            {selectedAddress && loadingLocations && <option value="" disabled>Loading nearby locations…</option>}
            {selectedAddress && !loadingLocations && locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {formatLocationOption(loc)}
              </option>
            ))}
          </select>
        </div>

            <div>
              <label className="block text-sm font-medium mb-1">Drop-off Date *</label>
              <select
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select a date</option>
                {availableDates.map(date => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Slot *</label>
              <select
                name="timeSlot"
                value={form.timeSlot}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                disabled={!form.dropoffLocation}
                required
              >
                <option value="">
                  {form.dropoffLocation ? 'Select a time slot' : 'Select location first'}
                </option>
                {availableTimeSlots.map((slot, idx) => (
                  <option key={idx} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Submit Donation
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-xl p-8 space-y-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-semibold text-gray-800">Donation Submitted!</h1>
          <p className="text-gray-700 text-lg">
            Thank you for giving your <span className="font-semibold text-indigo-600">'{productInfo?.productName}'</span> a second life! 20 points were awarded to your account.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
