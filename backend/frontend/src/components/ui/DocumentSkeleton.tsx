import { motion } from 'framer-motion'

export function DocumentGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card animate-pulse"
        >
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-10 h-10 rounded-lg bg-white/10 mb-4"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            className="h-4 bg-white/10 rounded-lg w-3/4 mb-3"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="h-3 bg-white/5 rounded w-1/2 mb-6"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            className="pt-4 border-t border-white/5 h-3 bg-white/5 rounded w-full"
          />
        </motion.div>
      ))}
    </div>
  )
}
