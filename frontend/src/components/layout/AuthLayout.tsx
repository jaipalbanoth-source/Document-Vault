import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, FileText, Sparkles, Lock } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}

const features = [
  { icon: FileText, text: 'Upload & organize PDFs securely' },
  { icon: Sparkles, text: 'Instant OCR text extraction' },
  { icon: Lock, text: 'Private vault with encrypted storage' },
]

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex"
    >
      {/* Brand panel */}
      <motion.div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full"
        >
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/40"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Document<span className="text-brand-300">Vault</span>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
              Your documents,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-violet-300 to-cyan-300">
                intelligently managed
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Secure PDF storage with automatic text extraction. Access your vault from anywhere.
            </p>

            <ul className="mt-10 space-y-4">
              {features.map(({ icon: Icon, text }, i) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <Icon className="w-4 h-4 text-brand-400" />
                  </span>
                  <span className="text-sm font-medium">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <p className="text-xs text-slate-600">© {new Date().getFullYear()} DocumentVault</p>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-brand-600/30 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-[#0a0a12] to-[#050508]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </motion.div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-600/30"
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl text-white">
              Document<span className="text-brand-400">Vault</span>
            </span>
          </div>

          <div className="card-strong p-8 sm:p-10">
            <motion.div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
              <p className="text-slate-400 mt-2 text-sm">{subtitle}</p>
            </motion.div>

            {children}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-slate-500"
            >
              {footer}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
