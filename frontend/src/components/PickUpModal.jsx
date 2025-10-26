import { useEffect, useState } from 'react'
import { getAvailableDates, getAvailableTimeSlots } from '../utils/DonationAPI'
import { createBusinessTransaction, updateItemStatus } from '../utils/FastAPIClient'
import { useAuth } from '../contexts/AuthContext'

export default function PickUpModal({ open, onClose, listing }) {
  const { getIdToken } = useAuth()
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const dates = getAvailableDates()

  useEffect(() => {
    if (!open) {
      setDate(''); setTimeSlot(''); setSlots([])
    }
  }, [open])

  useEffect(() => {
    // Reuse mock time slots util; backend scheduling could replace this later
    if (!listing || !listing.owner_email) { setSlots([]); return }
    getAvailableTimeSlots(listing.owner_email).then(setSlots).catch(() => setSlots([]))
  }, [listing])

  if (!open || !listing) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!date || !timeSlot) return
    setSubmitting(true)
    try {
      const token = await getIdToken()
      const identifier = listing.owner_email // businesses resolver can handle email or uid
      await createBusinessTransaction({
        identifier,
        idToken: token,
        payload: {
          transaction_type: 'Pickup',
          date,
          time: timeSlot,
          item_id: listing.qr_code_id || listing.id,
        },
      })
      // Mark the item as unavailable
      if (listing.qr_code_id || listing.id) {
        await updateItemStatus(listing.qr_code_id || listing.id, 'unavailable')
      }
      onClose(true)
    } catch (err) {
      console.error('Failed to schedule pickup', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to schedule pickup')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-1000">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose(false)} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 space-y-4" onClick={(e)=>e.stopPropagation()}>
          <h2 className="text-lg font-semibold">Schedule Pickup</h2>
          <div className="text-sm text-gray-600">
            <div><span className="font-medium text-gray-800">Item:</span> {listing.name}</div>
            <div><span className="font-medium text-gray-800">Pickup location:</span> {listing.owner_address || 'Unknown location'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <select value={date} onChange={(e)=>setDate(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="">Select a date</option>
              {dates.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time Slot *</label>
            <select value={timeSlot} onChange={(e)=>setTimeSlot(e.target.value)} className="w-full border rounded px-3 py-2" disabled={!date} required>
              <option value="">{date ? 'Select a time slot' : 'Select date first'}</option>
              {slots.map((s, i) => (<option key={i} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onClose(false)} className="px-4 py-2 rounded border">Cancel</button>
            <button disabled={submitting} type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60">
              {submitting ? 'Scheduling…' : 'Confirm Pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
