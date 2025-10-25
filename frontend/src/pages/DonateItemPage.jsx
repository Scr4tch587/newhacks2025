import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { fetchProductByQRCode, mockDropoffLocations, getAvailableTimeSlots, getAvailableDates } from '../utils/DonationAPI'

export default function DonateItemPage() {
  const navigate = useNavigate()
  
  // Step tracking
  const [step, setStep] = useState('scan') // 'scan', 'form', 'success'
  
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
  
  // Available options
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const availableDates = getAvailableDates()
  const scannerRef = useRef(null)

  // Camera permission prompt state (move here)
  const [cameraPromptVisible, setCameraPromptVisible] = useState(false)

  // Initialize QR scanner
  useEffect(() => {
    if (step === 'scan' && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      )

      scanner.render(
        async (decodedText) => {
          // Successfully scanned
          setQrCodeId(decodedText)
          
          // Fetch product info
          const product = await fetchProductByQRCode(decodedText)
          setProductInfo(product)
          
          // Clean up scanner and move to form
          scanner.clear()
          scannerRef.current = null
          setStep('form')
        },
        (error) => {
          // Scan error (ignore most errors, they're normal)
        }
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

  // Inject custom style for html5-qrcode camera permission button
  useEffect(() => {
    if (step === 'scan') {
      const style = document.createElement('style')
      style.innerHTML = `
        .html5-qrcode-button-camera-permission,
        button[aria-label*='camera permission'],
        button:contains('Request camera permissions'),
        .html5-qrcode-camera-permission {
          background: #6366f1 !important;
          color: #fff !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          border-radius: 0.5rem !important;
          padding: 0.75rem 2rem !important;
          margin: 1.5rem auto !important;
          display: block !important;
          box-shadow: 0 2px 8px rgba(99,102,241,0.15);
          border: none !important;
          cursor: pointer !important;
          transition: background 0.2s;
          text-align: center !important;
        }
        .html5-qrcode-button-camera-permission:hover,
        button[aria-label*='camera permission']:hover,
        .html5-qrcode-camera-permission:hover {
          background: #4338ca !important;
        }
        /* Style any span or a tag with the text as a fallback */
        #qr-reader span, #qr-reader a {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: #6366f1 !important;
          text-decoration: underline !important;
          cursor: pointer !important;
          display: block !important;
          margin: 1.5rem auto !important;
          text-align: center !important;
        }
      `
      document.head.appendChild(style)
      return () => { document.head.removeChild(style) }
    }
  }, [step])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate image format
      const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validFormats.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or WebP)')
        e.target.value = ''
        return
      }
      setForm(f => ({ ...f, photo: file }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    
    // Validate all fields
    if (!form.description || !form.photo || !form.dropoffLocation || !form.date || !form.timeSlot) {
      alert('Please fill in all fields')
      return
    }

    // TODO: Replace with real API call
    console.log('Submitting donation:', {
      qrCodeId,
      productInfo,
      ...form
    })

    setStep('success')
  }

  // Render QR Scanner
  if (step === 'scan') {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Scan Item QR Code</h1>
          <p className="text-gray-600 text-sm">Position the QR code within the frame to scan</p>
        </div>
        {cameraPromptVisible && (
          <button
            onClick={handleCustomCameraPrompt}
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

  // Render Success Message
  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-xl p-8 space-y-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-semibold text-gray-800">Donation Submitted!</h1>
        <p className="text-gray-700 text-lg">
          Thank you for giving your <span className="font-semibold text-indigo-600">'{productInfo?.productName}'</span> a second life! 
          When a new owner is found, points will be awarded to your account!
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
    )
  }

  // Render Form
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

        <div>
          <label className="block text-sm font-medium mb-1">Drop-off Location *</label>
          <select
            name="dropoffLocation"
            value={form.dropoffLocation}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select a location</option>
            {mockDropoffLocations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} - {loc.address}
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
