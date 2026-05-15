import { useState, useRef } from 'react'
import { documentsApi } from '../../api/documents'
import { getApiError } from '../../utils/helpers'
import { Upload, FileText, X, CheckCircle2, Loader2, CloudUpload } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onUploadSuccess: () => void
}

const MAX_MB = 20
const MAX_BYTES = MAX_MB * 1024 * 1024

export default function UploadForm({ onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (f: File): string | null => {
    if (f.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (f.size > MAX_BYTES) return `File must be under ${MAX_MB} MB.`
    return null
  }

  const handleFile = (f: File) => {
    const err = validate(f)
    if (err) {
      toast.error(err)
      return
    }
    setFile(f)
    setProgress(0)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    try {
      await documentsApi.upload(file, setProgress)
      toast.success('Document uploaded successfully!')
      setFile(null)
      setProgress(0)
      onUploadSuccess()
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card-strong p-6 shadow-xl shadow-black/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
          <CloudUpload className="w-5 h-5 text-brand-400" />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-lg font-semibold text-white">Upload PDF</h2>
          <p className="text-xs text-slate-500 mt-0.5">Drag & drop or browse files</p>
        </motion.div>
      </div>

      <motion.div
        whileHover={!file && !uploading ? { scale: 1.01 } : {}}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${
            dragOver
              ? 'border-brand-400 bg-brand-500/10 shadow-[0_0_40px_rgba(99,102,241,0.15)]'
              : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/10 hover:border-brand-500/40 hover:bg-white/[0.02]'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3 relative z-10"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[220px]" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-emerald-400/80 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/90 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 relative z-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600/25 to-brand-400/10 border border-white/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-brand-400" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <p className="text-sm font-medium text-slate-200">
                  Drop PDF here or <span className="text-brand-400">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1.5">PDF only · Max {MAX_MB} MB</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`absolute inset-0 bg-brand-500/5 blur-2xl transition-opacity duration-300 pointer-events-none ${dragOver ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.div>

      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between text-xs font-medium text-slate-400 mb-2"
            >
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </span>
              <span className="text-brand-400">{progress}%</span>
            </motion.div>
            <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: file && !uploading ? 1.01 : 1 }}
        whileTap={{ scale: file && !uploading ? 0.99 : 1 }}
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="btn-primary w-full mt-6 py-3"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload to vault
          </>
        )}
      </motion.button>
    </div>
  )
}
