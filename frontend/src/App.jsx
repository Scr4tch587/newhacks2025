import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BusinessDashboardPage from './pages/BusinessDashboardPage'
import RetailDashboardPage from './pages/RetailDashboardPage'
import PointsPage from './pages/PointsPage'
import DonateItemPage from './pages/DonateItemPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'


function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/business-dashboard" element={<BusinessDashboardPage />} />
  <Route path="/retail-dashboard" element={<RetailDashboardPage />} />
        <Route path="/points" element={<PointsPage />} />
        <Route path="/donate" element={<DonateItemPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App