import { Link } from 'react-router-dom'
import { type Document, documentsApi } from '../../api/documents'
import { formatBytes, formatDate } from '../../utils/helpers'
import { FileText, Trash2, ArrowUpRight, Search, FileQuestion } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { motion } from 'framer-motion'
import EmptyState from '../ui/EmptyState'
import ConfirmModal from '../ui/ConfirmModal'

interface Props {
  documents: Document[]
  searchQuery?: string
  onDeleteSuccess: () => void
}

export default function DocumentList({ documents, searchQuery = '', onDeleteSuccess }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await documentsApi.delete(confirmDelete.id)
      toast.success('Document deleted')
      onDeleteSuccess()
      setConfirmDelete(null)
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  if (documents.length === 0) {
    const isSearching = searchQuery.trim().length > 0
    return (
      <EmptyState
        icon={isSearching ? Search : FileQuestion}
        title={isSearching ? 'No matches found' : 'No documents yet'}
        description={
          isSearching
            ? `No documents match "${searchQuery}". Try a different search term.`
            : 'Upload your first PDF using the panel on the left to get started.'
        }
      />
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {documents.map((doc, index) => (
          <motion.article
            key={doc.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -4 }}
            className="card group glass-card-hover flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600/20 to-brand-500/5 border border-brand-500/20 flex items-center justify-center group-hover:shadow-[0_0_24px_rgba(99,102,241,0.2)] transition-shadow">
                <FileText className="w-6 h-6 text-brand-400" />
              </div>
              <button
                onClick={() => setConfirmDelete({ id: doc.id, name: doc.original_name })}
                disabled={deletingId === doc.id}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3
              className="font-semibold text-white text-sm line-clamp-2 mb-2 leading-snug"
              title={doc.original_name}
            >
              {doc.original_name}
            </h3>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 mb-4"
            >
              <span className="badge bg-white/5 text-slate-400 border border-white/5">
                {formatBytes(doc.file_size)}
              </span>
              <span className="badge bg-white/5 text-slate-400 border border-white/5">
                {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
              </span>
            </motion.div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500">{formatDate(doc.uploaded_at)}</span>
              <Link
                to={`/documents/${doc.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors group/link"
              >
                Open
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete document?"
        message={
          confirmDelete
            ? `"${confirmDelete.name}" will be permanently removed from your vault.`
            : ''
        }
        loading={deletingId !== null}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
