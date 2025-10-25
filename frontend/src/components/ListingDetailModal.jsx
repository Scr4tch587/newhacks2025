export default function ListingDetailModal({ isOpen, onClose, listing, onDonate }) {
  if (!isOpen || !listing) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 space-y-4">
          <div className="text-lg font-semibold">{listing.name}</div>
          <div className="text-sm text-gray-600">ID: {listing.id}</div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded border">Close</button>
            {onDonate && (
              <button onClick={() => onDonate(listing)} className="px-4 py-2 rounded bg-indigo-600 text-white">Donate Item</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
