import { useEffect, useState } from 'react'
import { fetchBusinessListings } from '../utils/BusinessFakeAPI'
import { getBusinessTransactions } from '../utils/FastAPIClient'
import { useAuth } from '../contexts/AuthContext'

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
  const scheduled = t?.scheduled_time ? new Date(t.scheduled_time) : null
  const createdBy = t?.created_by_name || t?.created_by_email || t?.name || 'Unknown'
  return (
    <div className="flex items-center justify-between border-b py-2">
      <div>
        <div className="font-medium">{t.item_name}</div>
        <div className="text-sm text-gray-600">{(t.transaction_type || '').toUpperCase()} — {createdBy}</div>
        {t.notes ? <div className="text-xs text-gray-500">{t.notes}</div> : null}
      </div>
      <div className="text-right">
        <div className="text-sm">{scheduled ? scheduled.toLocaleString() : `${t.date || ''} ${t.time || ''}`}</div>
      </div>
    </div>
  )
}

export default function BusinessDashboard() {
  const [listings, setListings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { getIdToken, user, loading: authLoading } = useAuth()

useEffect(() => {
  let mounted = true;

  async function load() {
    setLoading(true);
    try {
      // Wait for the AuthContext to finish loading and have a user
      if (authLoading) {
        // small early return — effect will re-run when authLoading/user change
        return
      }

      if (!user) {
        console.warn('User not signed in, cannot fetch transactions')
        return
      }

      const idToken = await getIdToken()
      console.log('Fetched ID token:', idToken)

      const [ls, tx] = await Promise.all([
        fetchBusinessListings({ owner_email: user.email || "owner@example.com" }),
        getBusinessTransactions(user.uid || 'loc-main', idToken),
      ])

      if (!mounted) return;

      setListings(ls || []);
      setTransactions(tx || []);
    } catch (e) {
      console.error("Failed to load business dashboard", e);
    } finally {
      if (mounted) setLoading(false);
    }
  }

  load();
  return () => {
    mounted = false;
  };
}, [authLoading, user]);


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
