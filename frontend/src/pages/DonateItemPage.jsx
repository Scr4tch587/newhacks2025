import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { fetchProductByQRCode, getAvailableTimeSlots, getAvailableDates } from '../utils/DonationAPI'
import { getNearbyBusinesses, api } from '../utils/FastAPIClient'
import { getFirebaseAuth, getIdToken } from '../utils/FirebaseAuth'

export default function DonateItemPage() {
  const navigate = useNavigate()

  // Steps: 'scan' | 'form' | 'success'
  const [step, setStep] = useState('scan')

  // QR scan results
  const [qrCodeId, setQrCodeId] = useState(null)
  const [productInfo, setProductInfo] = useState(null)

  // Form data
  const [form, setForm] = useState({
    description: '',
    photo: null,
    dropoffLocation: '',
    date: '',
    timeSlot: ''
  })

  // Options
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [address, setAddress] = useState('')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [locations, setLocations] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [txResult, setTxResult] = useState(null)
  const availableDates = getAvailableDates()
  const scannerRef = useRef(null)

  // Optional prompt state (not strictly needed but kept for UX)
  const [cameraPromptVisible] = useState(false)

  // Initialize QR scanner
  useEffect(() => {
    if (step === 'scan' && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      )
      scanner.render(
        async (decodedText) => {
          setQrCodeId(decodedText)
          const product = await fetchProductByQRCode(decodedText)
          setProductInfo(product)
          await scanner.clear()
          scannerRef.current = null
          setStep('form')
        },
        () => {}
      )
      scannerRef.current = scanner
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [step])

  // Load time slots when location changes
  useEffect(() => {
    if (form.dropoffLocation) {
      getAvailableTimeSlots(form.dropoffLocation).then(setAvailableTimeSlots)
    } else {
      setAvailableTimeSlots([])
    }
  }, [form.dropoffLocation])

  // Address autocomplete (Nominatim) and nearby lookup
  useEffect(() => {
    // when the user types, clear previously selected address
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

  // When an address is explicitly selected, load nearby businesses
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


  // Slightly nicer style for the camera permission button
  useEffect(() => {
    if (step !== 'scan') return
    const style = document.createElement('style')
    style.innerHTML = `
      .html5-qrcode-button-camera-permission,
      button[aria-label*='camera permission'],
      .html5-qrcode-camera-permission {
        background: #6366f1 !important;
        color: #fff !important;
        font-size: 1.1rem !important;
        font-weight: 600 !important;
        border-radius: 0.5rem !important;
        padding: 0.65rem 1.5rem !important;
        margin: 1rem auto !important;
        display: block !important;
        box-shadow: 0 2px 8px rgba(99,102,241,0.15);
        border: none !important;
        cursor: pointer !important;
      }
      .html5-qrcode-button-camera-permission:hover,
      button[aria-label*='camera permission']:hover {
        background: #4338ca !important;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [step])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleAddressChange = (e) => {
    setAddress(e.target.value)
  }

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
    // Ensure user is logged in
    const auth = getFirebaseAuth()
    const currentUser = auth.currentUser
    if (!currentUser) {
      alert('You must be logged in to submit a donation')
      return
    }

    const userName = currentUser.displayName || currentUser.email || null
    if (!userName) {
      alert('Unable to determine user name from account. Please ensure your profile has a display name or email.')
      return
    }

    // Build transaction payload — per backend BusinessTransaction model
    const payload = {
      name: userName,
      item_name: productInfo?.productName || form.description.split('\n')[0] || 'Donation',
      qr_code_id: qrCodeId || '',
      date: form.date,
      time: form.timeSlot,
      transaction_type: 'Dropoff'
    }

    try {
      // Retrieve Firebase ID token and include in Authorization header
      const idToken = await getIdToken()
      if (!idToken) {
        alert('You must be logged in to submit a donation')
        return
      }

      const resp = await api.post(
        `/businesses/${form.dropoffLocation}/transactions`,
        payload,
        { headers: { Authorization: `Bearer ${idToken}` } }
      )

      if (resp && (resp.status === 200 || resp.status === 201)) {
        console.log('Transaction created', resp.data)
        setTxResult(resp.data)
        setStep('success')
      } else {
        console.error('Unexpected response creating transaction', resp)
        alert('Donation submitted locally but failed to record a transaction with the business. Please try again.')
      }
    } catch (err) {
      console.error('Failed to create transaction', err)
      alert('Failed to record donation transaction: ' + (err?.response?.data?.detail || err.message || err))
    }
  }

  if (step === 'scan') {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Scan Item QR Code</h1>
          <p className="text-gray-600 text-sm">Position the QR code within the frame to scan</p>
        </div>
        {cameraPromptVisible && (
          <button
            onClick={() => {}}
            className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg mb-4 hover:bg-indigo-700 transition"
          >
            Enable Camera
          </button>
        )}
        <div id="qr-reader" className="w-full"></div>
        <button
          onClick={() => navigate(-1)}
          className="w-full px-4 py-2 rounded border hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-xl p-6 space-y-4 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-semibold text-gray-800">Donation Submitted!</h1>
        <p className="text-gray-700">
          Thank you for donating <span className="font-semibold text-indigo-600">{productInfo?.productName}</span>.
        </p>

        {txResult ? (
          <div className="mt-4 bg-gray-50 border rounded p-4 text-left">
            <div className="text-sm text-gray-500">Transaction recorded</div>
            <div className="font-medium mt-1">ID: <span className="font-mono text-sm">{txResult.id}</span></div>
            {txResult.transaction?.scheduled_time && (
              <div className="text-sm text-gray-600 mt-1">Scheduled: {new Date(txResult.transaction.scheduled_time).toLocaleString()}</div>
            )}
            <div className="mt-2 text-xs text-gray-600">A confirmation was sent to the drop-off location.</div>
          </div>
        ) : null}

        <div className="pt-4 flex justify-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
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

          {/* Suggestions dropdown */}
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
                {loc.name} - {loc.address} ({loc.distance_km} km)
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
  )
}
