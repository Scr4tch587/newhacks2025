// Mock data for items
const items = [
  {
    name: 'Jacket',
    description: 'Warm winter jacket',
    qr_code_id: 'qr1',
    owner_email: 'alice@example.com',
    status: 'available',
  },
  {
    name: 'Tent',
    description: '2-person camping tent',
    qr_code_id: 'qr2',
    owner_email: 'bob@example.com',
    status: 'available',
  },
  {
    name: 'Sleeping Bag',
    description: 'Cozy sleeping bag',
    qr_code_id: 'qr3',
    owner_email: 'carol@example.com',
    status: 'unavailable',
  },
  // Nearby GTA
  { name: 'Backpack', description: 'Daypack 20L', qr_code_id: 'qr4', owner_email: 'dave@near.example.com', status: 'available' },
  { name: 'Hiking Boots', description: "Men's size 10", qr_code_id: 'qr5', owner_email: 'eve@near.example.com', status: 'available' },
  // Regional
  { name: 'Cookset', description: 'Lightweight pot + stove', qr_code_id: 'qr6', owner_email: 'frank@ottawa.example.com', status: 'available' },
  { name: 'Water Filter', description: 'Pump filter', qr_code_id: 'qr7', owner_email: 'grace@montreal.example.com', status: 'available' },
  // Cross-border
  { name: 'Headlamp', description: 'Rechargeable', qr_code_id: 'qr8', owner_email: 'heidi@nyc.example.com', status: 'available' },
  // Far away
  { name: 'Climbing Rope', description: '60m dynamic', qr_code_id: 'qr9', owner_email: 'ivan@vancouver.example.com', status: 'available' },
]

// Mock owner locations
const ownerLocations = {
  // Downtown Toronto
  'alice@example.com': { lat: 43.653, lng: -79.383 },
  'bob@example.com': { lat: 43.651, lng: -79.387 },
  'carol@example.com': { lat: 43.655, lng: -79.380 },
  // Greater Toronto Area
  'dave@near.example.com': { lat: 43.589, lng: -79.644 }, // Mississauga
  'eve@near.example.com': { lat: 43.856, lng: -79.337 }, // Markham
  // Regional cities
  'frank@ottawa.example.com': { lat: 45.4215, lng: -75.6972 }, // Ottawa
  'grace@montreal.example.com': { lat: 45.5017, lng: -73.5673 }, // Montreal
  // Cross-border
  'heidi@nyc.example.com': { lat: 40.7128, lng: -74.006 }, // New York City
  // Far away
  'ivan@vancouver.example.com': { lat: 49.2827, lng: -123.1207 }, // Vancouver
}

export function fetchItems() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(items), 300)
  })
}

export function fetchOwnerLocation(owner_email) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ownerLocations[owner_email]), 200)
  })
}
