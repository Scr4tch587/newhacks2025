import { useState } from 'react'

export default function MapSidebar({ listings = [], onSelectListing }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-12' : 'w-80'
      } h-full flex flex-col shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && <h2 className="text-lg font-semibold text-gray-800">Listings</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Listings */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {listings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No listings available</p>
            </div>
          ) : (
            listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => onSelectListing?.(listing)}
                className="p-3 border border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all"
              >
                <h3 className="font-semibold text-gray-800 mb-1">{listing.title || listing.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {listing.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km` : (listing.location || 'Location')}
                  </span>
                  {listing.price && (
                    <span className="font-semibold text-indigo-600">${listing.price}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
