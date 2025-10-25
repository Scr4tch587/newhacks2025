// Mock API functions for donation flow

// Mock: QR code ID -> Product details
export function fetchProductByQRCode(qrCodeId) {
  const mockProducts = {
    'QR12345': { productId: 'PROD-001', productName: 'Winter Jacket' },
    'QR67890': { productId: 'PROD-002', productName: 'Camping Tent' },
    'QR11111': { productId: 'PROD-003', productName: 'Sleeping Bag' },
    'QR22222': { productId: 'PROD-004', productName: 'Backpack' },
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = mockProducts[qrCodeId] || { 
        productId: 'PROD-999', 
        productName: 'Unknown Item' 
      }
      resolve(product)
    }, 500)
  })
}

// Mock: Dropoff locations
export const mockDropoffLocations = [
  { id: 'loc1', name: 'Downtown Community Center', address: '123 Main St' },
  { id: 'loc2', name: 'North Campus Hub', address: '456 University Ave' },
  { id: 'loc3', name: 'East Side Library', address: '789 Queen St E' },
  { id: 'loc4', name: 'West End Recreation Center', address: '321 Dundas St W' },
]

// Mock: Available time slots based on location
export function getAvailableTimeSlots(locationId) {
  const baseSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
  ]
  
  // Different locations might have different availability (mocked)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(baseSlots)
    }, 300)
  })
}

// Mock: Get available dates (next 7 days)
export function getAvailableDates() {
  const dates = []
  const today = new Date()
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    })
  }
  
  return dates
}
