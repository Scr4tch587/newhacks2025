// Mock API for business dashboard data (listings owned by a business + scheduled pickup/dropoff transactions)

const mockListings = [
  {
    id: 'b1',
    name: 'Community Tent (x2)',
    description: '2-person camping tents available for community lending',
    status: 'available',
    quantity: 2,
    last_checked_in: '2025-10-20T09:12:00Z',
  },
  {
    id: 'b2',
    name: 'Warm Winter Jackets',
    description: 'Various sizes, cleaned and ready',
    status: 'reserved',
    quantity: 5,
    last_checked_in: '2025-10-22T14:05:00Z',
  },
  {
    id: 'b3',
    name: 'Backpacks (Daypacks)',
    description: '20L daypacks for rent or community share',
    status: 'available',
    quantity: 8,
    last_checked_in: '2025-10-23T11:30:00Z',
  },
]

const mockTransactions = [
  {
    id: 't1',
    type: 'pickup', // pickup to be done at business location
    item_name: 'Warm Winter Jackets',
    item_id: 'b2',
    user_name: 'Jamal H.',
    scheduled_time: '2025-10-26T10:00:00Z',
    status: 'scheduled',
    notes: 'Customer will arrive by bike',
  },
  {
    id: 't2',
    type: 'dropoff', // dropoff at business location
    item_name: 'Sleeping Bag (donation)',
    item_id: null,
    user_name: 'Olivia P.',
    scheduled_time: '2025-10-25T15:30:00Z',
    status: 'arriving_soon',
    notes: 'Donor asked for quick donation receipt',
  },
  {
    id: 't3',
    type: 'pickup',
    item_name: 'Backpacks (Daypacks)',
    item_id: 'b3',
    user_name: 'Carlos R.',
    scheduled_time: '2025-10-27T09:15:00Z',
    status: 'scheduled',
    notes: '',
  },
]

export function fetchBusinessListings({ owner_email } = {}) {
  // In a real app we'd filter by owner_email. Here we ignore it and return mock data.
  return new Promise((resolve) => setTimeout(() => resolve(mockListings), 250))
}

export function fetchTransactionsForLocation({ location_id } = {}) {
  // In real world we'd filter by location. Return the mock transactions with small delay.
  return new Promise((resolve) => setTimeout(() => resolve(mockTransactions), 300))
}

export default {
  fetchBusinessListings,
  fetchTransactionsForLocation,
}
