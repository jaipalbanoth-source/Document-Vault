import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Shield, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600/30 to-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-brand-400" />
          </div>
          <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 text-brand-400 animate-spin" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <p className="text-white font-medium">Securing your session</p>
          <p className="text-sm text-slate-500 mt-1">Please wait a moment...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
