import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface InputFieldProps {
  label: string
  icon: LucideIcon
  error?: string
  type?: string
  placeholder?: string
  autoComplete?: string
  registration: object
}

export default function InputField({
  label,
  icon: Icon,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  registration,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <motion.div whileFocus={{ scale: 1.005 }} className="relative group">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-400 transition-colors pointer-events-none" />
        <input
          {...registration}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`input pl-11 ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
        />
      </motion.div>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
