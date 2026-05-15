import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DocumentDetail from './pages/DocumentDetail'

const AUTH_PATHS = ['/login', '/register']

export default function App() {
  const { fetchMe } = useAuthStore()
  const location = useLocation()
  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      {!isAuthPage && <Navbar />}
      <main className={`flex-1 ${isAuthPage ? '' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </motion.div>
  )
}
