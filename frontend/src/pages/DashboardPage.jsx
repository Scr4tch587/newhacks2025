import { useEffect, useState } from 'react'
import MapComponent from '../components/MapComponent'
import ListingDetailModal from '../components/ListingDetailModal'
import DonateItemModal from '../components/DonateItemModal'
import { getListings, createListing } from '../utils/FastAPIClient'
import { fetchSaleorListings } from '../utils/SaleorAPI'

export default function DashboardPage() {
  const [listings, setListings] = useState([])
  const [selected, setSelected] = useState(null)
  const [showDonate, setShowDonate] = useState(false)

  useEffect(() => {
    // Try backend listings first, fallback to Saleor demo
    (async () => {
      try {
        const data = await getListings()
        setListings(data)
      } catch (e) {
        console.warn('Falling back to Saleor demo listings', e)
        try {
          const saleor = await fetchSaleorListings()
          setListings(saleor)
        } catch (e2) {
          console.error('Failed to load listings', e2)
        }
      }
    })()
  }, [])

  const submitDonation = async (form) => {
    try {
      await createListing(form)
      alert('Donation submitted!')
    } catch (e) {
      console.error(e)
      alert('Failed to submit donation')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Nearby Listings</h1>
        <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={() => setShowDonate(true)}>Donate Item</button>
      </div>
      <MapComponent listings={listings} onSelectListing={setSelected} />

      <ListingDetailModal isOpen={!!selected} listing={selected} onClose={() => setSelected(null)} onDonate={() => setShowDonate(true)} />
      <DonateItemModal isOpen={showDonate} onClose={() => setShowDonate(false)} onSubmit={submitDonation} />
    </div>
  )
}
