import { useState } from 'react'

export default function DonateItemModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ description: '', location: '', qr: '' })
  if (!isOpen) return null

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    await onSubmit?.(form)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 space-y-4 pointer-events-auto">
          <div className="text-lg font-semibold">Donate an Item</div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">QR/NFC Code</label>
              <input name="qr" value={form.qr} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Scan or paste code" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g., City pass, museum ticket" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Drop-off Location</label>
              <input name="location" value={form.location} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="123 Main St" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
