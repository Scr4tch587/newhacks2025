// Minimal Saleor GraphQL helper (optional)
const SALEOR_URL = import.meta.env.VITE_SALEOR_GRAPHQL_URL
const SALEOR_TOKEN = import.meta.env.VITE_SALEOR_TOKEN

export async function saleorQuery(query, variables = {}) {
  if (!SALEOR_URL) throw new Error('VITE_SALEOR_GRAPHQL_URL not set')
  const res = await fetch(SALEOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SALEOR_TOKEN ? { Authorization: `Bearer ${SALEOR_TOKEN}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '))
  return json.data
}

export async function fetchSaleorListings() {
  const query = `
    query Listings($first: Int!) {
      products(first: $first) {
        edges { node { id name slug } }
      }
    }
  `
  const data = await saleorQuery(query, { first: 20 })
  // Map to a simple listing shape
  return (data?.products?.edges || []).map(e => ({
    id: e.node.id,
    name: e.node.name,
    slug: e.node.slug,
    // placeholder coords for demo
    lat: 43.653, lng: -79.383,
  }))
}
