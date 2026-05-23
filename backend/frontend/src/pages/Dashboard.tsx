import { useMemo, useState } from 'react'
import { documentsApi } from '../api/documents'
import { useAuthStore } from '../store/authStore'
import UploadForm from '../components/documents/UploadForm'
import DocumentList from '../components/documents/DocumentList'
import PageHeader from '../components/ui/PageHeader'
import { DocumentGridSkeleton } from '../components/ui/DocumentSkeleton'
import { FileText, HardDrive, Layers, Search, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { formatBytes } from '../utils/helpers'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list().then((res) => res.data.documents),
  })

  const documents = data || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((d) => d.original_name.toLowerCase().includes(q))
  }, [documents, search])

  const stats = useMemo(() => {
    const totalSize = documents.reduce((acc, d) => acc + d.file_size, 0)
    const totalPages = documents.reduce((acc, d) => acc + d.page_count, 0)
    return {
      count: documents.length,
      size: formatBytes(totalSize),
      pages: totalPages,
    }
  }, [documents])

  const displayName = user?.full_name || user?.email.split('@')[0]

  return (
    <div className="page-container space-y-8">
      <PageHeader
        title={`Hello, ${displayName}`}
        description="Upload PDFs, extract text instantly, and manage your secure document library."
        badge={`${stats.count} document${stats.count === 1 ? '' : 's'}`}
        icon={FileText}
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { icon: FileText, label: 'Total documents', value: String(stats.count), color: 'text-brand-400' },
          { icon: HardDrive, label: 'Storage used', value: stats.size, color: 'text-violet-400' },
          { icon: Layers, label: 'Total pages', value: String(stats.pages), color: 'text-cyan-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileHover={{ y: -2 }}
            className="stat-card"
          >
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] gap-8">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:sticky lg:top-24"
          >
            <UploadForm onUploadSuccess={() => refetch()} />
          </motion.div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="section-title">
              <FileText className="w-5 h-5 text-brand-400" />
              Your library
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="search-input"
              />
            </div>
          </div>

          {isLoading ? (
            <DocumentGridSkeleton />
          ) : isError ? (
            <div className="card flex flex-col items-center py-16 text-center border-red-500/20 bg-red-500/5">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Failed to load documents</h3>
              <p className="text-slate-400 text-sm mb-6">Check your connection and try again.</p>
              <button onClick={() => refetch()} className="btn-primary">
                Retry
              </button>
            </div>
          ) : (
            <DocumentList
              documents={filtered}
              searchQuery={search}
              onDeleteSuccess={() => refetch()}
            />
          )}
        </motion.section>
      </div>
    </div>
  )
}
