import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="card-strong max-w-md w-full p-6 pointer-events-auto shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <motion.div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={onCancel} className="btn-ghost flex-1 border border-white/10">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="btn-danger flex-1 justify-center"
                >
                  {loading ? 'Deleting...' : confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
