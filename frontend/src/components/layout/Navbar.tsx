import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass border-b border-white/10"
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -3 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-600/30"
            >
              <Shield className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </motion.div>
            <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Document<span className="text-brand-400">Vault</span>
            </span>
          </Link>

          {user && (
            <nav className="hidden sm:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive('/dashboard')
                    ? 'text-brand-300 bg-brand-500/15 border border-brand-500/25 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </nav>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2.5 pl-3 pr-4 py-1.5 glass rounded-full border-white/5">
                <motion.div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                </motion.div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white leading-tight truncate max-w-[140px]">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-ghost text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.header>
  )
}
