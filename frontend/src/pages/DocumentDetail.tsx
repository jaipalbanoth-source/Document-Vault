import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsApi } from '../api/documents'
import { formatBytes, formatDate, getApiError } from '../utils/helpers'
import {
  FileText,
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  Clock,
  Database,
  Layers,
  Copy,
  Check,
  Shield,
  Sparkles,
  Send,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../components/ui/ConfirmModal'

interface QAMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // Q&A state
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [messages, setMessages] = useState<QAMessage[]>([])
  const [qaError, setQaError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: doc, isLoading, isError, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(parseInt(id!)).then((res) => res.data),
    enabled: !!id,
    retry: false,
  })

  useEffect(() => {
    if (isError) {
      toast.error(getApiError(error))
      navigate('/dashboard')
    }
  }, [isError, error, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, asking])

  const handleDelete = async () => {
    if (!doc) return
    setDeleting(true)
    try {
      await documentsApi.delete(doc.id)
      toast.success('Document deleted')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getApiError(err))
      setDeleting(false)
    }
  }

  const handleCopy = async () => {
    if (!doc?.extracted_text) return
    try {
      await navigator.clipboard.writeText(doc.extracted_text)
      setCopied(true)
      toast.success('Text copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy text')
    }
  }

  const handleAsk = async () => {
    if (!question.trim() || asking || !doc) return
    const q = question.trim()
    setQuestion('')
    setQaError(null)
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setAsking(true)

    try {
      const res = await documentsApi.ask(doc.id, q)
      if (res.data.error) {
        setQaError(res.data.error)
        setMessages((prev) => prev.slice(0, -1)) // remove unanswered user msg
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.data.answer },
        ])
      }
    } catch (err) {
      setQaError(getApiError(err))
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setAsking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page-container min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
        <p className="text-slate-400 font-medium">Opening document...</p>
      </div>
    )
  }

  if (!doc) return null

  const metadata = [
    { icon: FileText, label: 'Filename', value: doc.original_name, color: 'text-blue-400' },
    { icon: Database, label: 'File size', value: formatBytes(doc.file_size), color: 'text-violet-400' },
    { icon: Layers, label: 'Pages', value: `${doc.page_count}`, color: 'text-brand-400' },
    { icon: Clock, label: 'Uploaded', value: formatDate(doc.uploaded_at), color: 'text-amber-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page-container space-y-8"
    >
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
        >
          <span className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-brand-500/30 group-hover:bg-brand-500/10 transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </span>
          <span className="text-sm font-medium">Back to library</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {doc.extracted_text && (
            <button onClick={handleCopy} className="btn-secondary">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy text'}
            </button>
          )}
          <a href={documentsApi.downloadUrl(doc.id)} download={doc.original_name} className="btn-secondary">
            <Download className="w-4 h-4" />
            Download
          </a>
          <button onClick={() => setShowDeleteModal(true)} disabled={deleting} className="btn-danger">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h1 className="page-title text-2xl sm:text-3xl line-clamp-2" title={doc.original_name}>
          {doc.original_name}
        </h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20">
            {formatBytes(doc.file_size)}
          </span>
          <span className="badge bg-white/5 text-slate-400 border border-white/5">
            {doc.page_count} pages
          </span>
          {doc.extracted_text && (
            <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OCR extracted
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Main content */}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-strong overflow-hidden p-0"
        >
          <div className="px-6 sm:px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="section-title mb-0">
              <FileText className="w-5 h-5 text-brand-400" />
              Extracted text
            </h2>
          </div>

          <div className="p-6 sm:p-8">
            {doc.extracted_text ? (
              <div className="text-viewer">{doc.extracted_text}</div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <Layers className="w-12 h-12 text-slate-600 mb-4" />
                <p className="font-semibold text-white/80">No text detected</p>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">
                  This PDF may be image-only or encrypted. You can still download the original file.
                </p>
              </div>
            )}
          </div>
        </motion.main>

        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6 lg:sticky lg:top-24"
        >
          {/* Metadata */}
          <div className="card-strong p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
              Document details
            </h3>
            <div className="space-y-5">
              {metadata.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {item.label}
                    </p>
                    <p className="text-sm text-slate-100 truncate font-medium mt-0.5" title={item.value}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q&A Panel */}
          <div className="card-strong p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Ask this document</h3>
            </div>

            {/* Messages */}
            <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
              {messages.length === 0 && !asking && (
                <p className="text-xs text-slate-500 text-center py-4 leading-relaxed">
                  Ask anything about the document content. Powered by RAG .
                </p>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-500/20 text-brand-100 border border-brand-500/20'
                          : 'bg-white/5 text-slate-200 border border-white/10'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {asking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
                      <span className="text-xs text-slate-400">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {qaError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">{qaError}</p>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAsk()
                    }
                  }}
                  placeholder="Ask a question..."
                  disabled={asking}
                  className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 disabled:opacity-50 transition-all"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAsk}
                  disabled={!question.trim() || asking}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 hover:bg-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {asking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 text-center">
                Enter to send · Requires OpenAI key on server
              </p>
            </div>
          </div>

          {/* Security badge */}
          <div className="card p-5 border-brand-500/15 bg-brand-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-brand-400" />
              <p className="text-xs font-bold text-brand-300 uppercase tracking-wider">Secure storage</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your document is stored in your private vault with authenticated access only.
            </p>
          </div>
        </motion.aside>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete document?"
        message={`"${doc.original_name}" will be permanently removed.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </motion.div>
  )
}