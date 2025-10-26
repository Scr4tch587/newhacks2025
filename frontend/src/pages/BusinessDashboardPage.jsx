import BusinessDashboard from '../components/BusinessDashboard'

export default function BusinessDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Business Dashboard</h1>
      </div>
      <BusinessDashboard />
    </div>
  )
}
