import { useEffect, useState } from 'react'
import { getBusinessTransactions, getHeldItemsByEmail, updateItemStatus, deleteBusinessTransaction } from '../utils/FastAPIClient'
import { useAuth } from '../contexts/AuthContext'

function ListingCard({ l }) {
  return (
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{l.name}</h3>
          {l.description && <p className="text-sm text-gray-600">{l.description}</p>}
        </div>
        <div className="text-right">
          {l.qr_code_id && <div className="text-xs text-gray-500">ID: {l.qr_code_id}</div>}
          <div className={`mt-2 px-2 py-1 rounded text-xs ${l.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{l.status || 'unknown'}</div>
        </div>
      </div>
      {l.created_at && (
        <div className="mt-2 text-xs text-gray-500">Created: {new Date(l.created_at).toLocaleString()}</div>
      )}
    </div>
  )
}

function TransactionRow({ t, onConfirmDropoff, onConfirmPickup }) {
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
        {(t.transaction_type || '').toLowerCase() === 'dropoff' && t.qr_code_id ? (
          <button
            onClick={() => onConfirmDropoff?.(t)}
            className="mt-2 inline-flex items-center px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            Confirm Dropoff
          </button>
        ) : null}
        {(t.transaction_type || '').toLowerCase() === 'pickup' && t.qr_code_id ? (
          <button
            onClick={() => onConfirmPickup?.(t)}
            className="mt-2 ml-2 inline-flex items-center px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Confirm Pickup
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function BusinessDashboard() {
  const [listings, setListings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState("")
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
        getHeldItemsByEmail(user.email || ''),
        getBusinessTransactions(user.uid || 'loc-main', idToken),
      ])

      if (!mounted) return;

      // Only display AVAILABLE listings
      const onlyAvailable = Array.isArray(ls) ? ls.filter((it) => (it?.status || '').toLowerCase() === 'available') : []
      setListings(onlyAvailable);
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
            listings.map((l) => <ListingCard key={l.qr_code_id || l.id || l.name} l={l} />)
          )}
        </div>
      </div>

      <div className="w-1/2 overflow-auto">
        <h2 className="text-lg font-medium mb-3">Scheduled Pickups & Dropoffs (at your location)</h2>
        <div className="bg-white rounded border shadow-sm p-2">
          {toast ? (
            <div className="mb-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 text-sm">
              {toast}
            </div>
          ) : null}
          {loading ? <div className="text-gray-500">Loading transactions…</div> : (
            transactions.length === 0 ? <div className="text-gray-500 p-4">No upcoming activity.</div> : (
              transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  t={t}
                  onConfirmDropoff={async (tx) => {
                    try {
                      const idToken = await getIdToken()
                      // 1) Set item status to 'available'
                      await updateItemStatus(tx.qr_code_id, 'available')
                      // 2) Delete the transaction
                      await deleteBusinessTransaction({ identifier: user.uid || '', transactionId: tx.id, idToken })
                      // 3) Update UI state: remove tx and refresh available listings
                      setTransactions((prev) => prev.filter((p) => p.id !== tx.id))
                      try {
                        const ls = await getHeldItemsByEmail(user.email || '')
                        const onlyAvailable = Array.isArray(ls) ? ls.filter((it) => (it?.status || '').toLowerCase() === 'available') : []
                        setListings(onlyAvailable)
                      } catch {}
                      // 4) Show success toast
                      setToast('Dropoff confirmed')
                      setTimeout(() => setToast(''), 3000)
                    } catch (e) {
                      console.error('Confirm dropoff failed', e)
                      alert(e?.response?.data?.detail || e?.message || 'Failed to confirm dropoff')
                    }
                  }}
                  onConfirmPickup={async (tx) => {
                    try {
                      const idToken = await getIdToken()
                      // 1) Set item status to 'unavailable'
                      await updateItemStatus(tx.qr_code_id, 'unavailable')
                      // 2) Delete the transaction
                      await deleteBusinessTransaction({ identifier: user.uid || '', transactionId: tx.id, idToken })
                      // 3) Update UI state: remove tx and refresh available listings (item should disappear)
                      setTransactions((prev) => prev.filter((p) => p.id !== tx.id))
                      try {
                        const ls = await getHeldItemsByEmail(user.email || '')
                        const onlyAvailable = Array.isArray(ls) ? ls.filter((it) => (it?.status || '').toLowerCase() === 'available') : []
                        setListings(onlyAvailable)
                      } catch {}
                      // 4) Show success toast
                      setToast('Pickup confirmed')
                      setTimeout(() => setToast(''), 3000)
                    } catch (e) {
                      console.error('Confirm pickup failed', e)
                      alert(e?.response?.data?.detail || e?.message || 'Failed to confirm pickup')
                    }
                  }}
                />
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}
