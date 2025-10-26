export default function ListingDetailModal({ isOpen, onClose, listing, onDonate }) {
  if (!isOpen || !listing) return null
  const imageUrl = listing.image_url || listing.image_link || null
  const retailerName = listing.owner_name || listing.retailer_name || listing.owner_email || 'Unknown retailer'
  const pickupLocation = listing.owner_address || listing.address || 'Unknown location'

  return (
    <div className="fixed inset-0 z-1000">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-lg shadow-xl p-0 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Image area */}
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={listing.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">No image available</div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-3">
            <div className="text-lg font-semibold">{listing.name}</div>
            {listing.description && (
              <p className="text-sm text-gray-700">{listing.description}</p>
            )}
            <div className="text-sm text-gray-600">
              <div><span className="font-medium text-gray-800">Retailer:</span> {retailerName}</div>
              <div><span className="font-medium text-gray-800">Pickup location:</span> {pickupLocation}</div>
              {typeof listing.distanceKm === 'number' && (
                <div><span className="font-medium text-gray-800">Distance:</span> {listing.distanceKm.toFixed(1)} km</div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded border">Close</button>
              {onDonate && (
                <button onClick={() => onDonate(listing)} className="px-4 py-2 rounded bg-indigo-600 text-white">Pick Up Item</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
