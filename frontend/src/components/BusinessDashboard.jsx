import { useEffect, useState } from 'react'
import { fetchBusinessListings, fetchTransactionsForLocation } from '../utils/BusinessFakeAPI'

function ListingCard({ l }) {
  return (
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{l.name}</h3>
          <p className="text-sm text-gray-600">{l.description}</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Qty: <span className="font-medium">{l.quantity}</span></div>
          <div className={`mt-2 px-2 py-1 rounded text-xs ${l.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{l.status}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">Last checked: {new Date(l.last_checked_in).toLocaleString()}</div>
    </div>
  )
}

function TransactionRow({ t }) {
  const scheduled = new Date(t.scheduled_time)
  return (
    <div className="flex items-center justify-between border-b py-2">
      <div>
        <div className="font-medium">{t.item_name}</div>
        <div className="text-sm text-gray-600">{t.type.toUpperCase()} — {t.user_name}</div>
        {t.notes ? <div className="text-xs text-gray-500">{t.notes}</div> : null}
      </div>
      <div className="text-right">
        <div className="text-sm">{scheduled.toLocaleString()}</div>
        <div className="text-xs mt-1 px-2 py-0.5 rounded {t.status === 'arriving_soon' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}">{t.status}</div>
      </div>
    </div>
  )
}

export default function BusinessDashboard() {
  const [listings, setListings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [ls, tx] = await Promise.all([
          fetchBusinessListings({ owner_email: 'owner@example.com' }),
          fetchTransactionsForLocation({ location_id: 'loc-main' }),
        ])
        if (!mounted) return
        setListings(ls || [])
        setTransactions(tx || [])
      } catch (e) {
        console.error('Failed to load business dashboard', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="flex gap-6 h-[70vh]">
      <div className="w-1/2 overflow-auto">
        <h2 className="text-lg font-medium mb-3">Your Listings</h2>
        <div className="space-y-3">
          {loading ? <div className="text-gray-500">Loading listings…</div> : (
            listings.map((l) => <ListingCard key={l.id} l={l} />)
          )}
        </div>
      </div>

      <div className="w-1/2 overflow-auto">
        <h2 className="text-lg font-medium mb-3">Scheduled Pickups & Dropoffs (at your location)</h2>
        <div className="bg-white rounded border shadow-sm p-2">
          {loading ? <div className="text-gray-500">Loading transactions…</div> : (
            transactions.length === 0 ? <div className="text-gray-500 p-4">No upcoming activity.</div> : (
              transactions.map((t) => <TransactionRow key={t.id} t={t} />)
            )
          )}
        </div>
      </div>
    </div>
  )
}
