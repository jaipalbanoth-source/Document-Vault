import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  icon?: LucideIcon
}

export default function PageHeader({ title, description, badge, icon: Icon }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-header"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600/20 to-brand-500/10 border border-brand-500/20 items-center justify-center shrink-0"
            >
              <Icon className="w-7 h-7 text-brand-400" />
            </motion.div>
          )}
          <div>
            <h1 className="page-title">{title}</h1>
            {description && <p className="page-description mt-2">{description}</p>}
          </div>
        </div>
        {badge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20 w-fit"
          >
            {badge}
          </motion.span>
        )}
      </div>
    </motion.header>
  )
}
