import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRetailItemByQr } from '../utils/FastAPIClient'

export default function RetailItemQRPage() {
  const { qrId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const resp = await getRetailItemByQr(qrId)
        if (!cancelled) setData(resp)
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || e?.message || 'Failed to load item')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [qrId])

  const handleDownloadQR = () => {
    if (!data?.qr_code_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${data.qr_code_base64}`
    link.download = `${data.qr_code_id || 'item-qr'}.png`
    link.click()
  }

  const handlePrintQR = () => {
    if (!data?.qr_code_base64) return
    const w = window.open('', '_blank', 'width=400,height=500')
    if (!w) return
    const imgSrc = `data:image/png;base64,${data.qr_code_base64}`
    w.document.write(`<!doctype html><html><head><title>Print QR</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <img src="${imgSrc}" style="width:256px;height:256px;object-fit:contain;" />
        <div style="margin-top:12px;font-size:14px;color:#333;">QR Code: ${data.qr_code_id || ''}</div>
      </div>
    </body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  if (loading) return <div className="max-w-xl mx-auto p-4">Loading…</div>
  if (error) return (
    <div className="max-w-xl mx-auto p-4">
      <div className="text-red-600">{error}</div>
      <button onClick={() => navigate(-1)} className="mt-2 px-4 py-2 rounded border">Back</button>
    </div>
  )

  const item = data?.item || {}

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Item QR</h1>
      <div className="bg-white border rounded p-6 space-y-4 text-center">
        <div className="text-sm text-gray-600">QR Code ID</div>
        <div className="text-lg font-mono">{data?.qr_code_id}</div>
        {data?.qr_code_base64 ? (
          <img src={`data:image/png;base64,${data.qr_code_base64}`} alt="QR Code" className="mx-auto w-48 h-48" />
        ) : (
          <div className="text-gray-500">QR code image not available.</div>
        )}
        {item?.image_url && (
          <div>
            <div className="text-sm text-gray-600 mb-1">Item image</div>
            <img src={item.image_url} alt={item.name || 'Item'} className="mx-auto w-40 h-40 object-cover rounded" />
          </div>
        )}
        <div className="text-left text-sm text-gray-700">
          <div><span className="font-medium">Name:</span> {item?.name}</div>
          <div><span className="font-medium">Description:</span> {item?.description}</div>
        </div>
        <div className="flex justify-center gap-2">
          <button onClick={handleDownloadQR} className="px-4 py-2 rounded border">Download QR</button>
          <button onClick={handlePrintQR} className="px-4 py-2 rounded border">Print</button>
          <button onClick={()=>navigate(-1)} className="px-4 py-2 rounded bg-indigo-600 text-white">Back</button>
        </div>
      </div>
    </div>
  )
}
