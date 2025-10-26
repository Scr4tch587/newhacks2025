import React, { useState } from "react"
import { createItem } from "../utils/FastAPIClient"

export default function CreateItemPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    retailer_email: "",
    image: null,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files[0] }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await createItem(form)
      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Create Retail Item</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          type="text"
          placeholder="Item name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="retailer_email"
          type="email"
          placeholder="Retailer Email"
          value={form.retailer_email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creating..." : "Create Item"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {result && (
        <div className="mt-6 text-center">
          <h2 className="text-lg font-semibold mb-2">✅ Item Created!</h2>
          <p>QR Code ID: {result.qr_code_id}</p>
          {result.qr_code_base64 && (
            <img
              src={`data:image/png;base64,${result.qr_code_base64}`}
              alt="QR Code"
              className="mx-auto mt-4 w-40 h-40"
            />
          )}
          {result.image_url && (
            <img
              src={result.image_url}
              alt="Uploaded Item"
              className="mx-auto mt-4 w-40 h-40 rounded"
            />
          )}
        </div>
      )}
    </div>
  )
}
