import { useEffect, useRef, useState } from 'react'

// Minimal placeholder QR scanner: just uses a text input for now.
export default function QRScannerModal({ isOpen, onClose, onResult }) {
  const [value, setValue] = useState('')
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 space-y-4">
          <div className="text-lg font-semibold">Scan QR Code</div>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Paste simulated QR code here"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button onClick={() => { onResult?.(value); onClose?.() }} className="px-4 py-2 rounded bg-indigo-600 text-white">Use Value</button>
          </div>
        </div>
      </div>
    </div>
  )
}
