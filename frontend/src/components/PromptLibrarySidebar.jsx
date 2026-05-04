import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Search, Trash2, Copy, Check } from 'lucide-react'
import axios from 'axios'

const PLATFORM_COLORS = {
  gemini: 'text-blue-500',
  chatgpt: 'text-emerald-500',
  kling: 'text-violet-500',
  stable_diffusion: 'text-orange-500',
}

const PLATFORM_LABELS = {
  gemini: 'Gemini',
  chatgpt: 'ChatGPT',
  kling: 'Kling',
  stable_diffusion: 'SD',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString()
}

function LibraryEntry({ entry, onDelete }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.prompt_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tags = (() => { try { return JSON.parse(entry.tags || '[]') } catch { return [] } })()

  return (
    <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-semibold ${PLATFORM_COLORS[entry.platform] || 'text-gray-500'}`}>
            {PLATFORM_LABELS[entry.platform] || entry.platform}
          </span>
          {entry.label && (
            <>
              <span className="text-gray-300 dark:text-white/20 text-xs">·</span>
              <span className="text-gray-400 dark:text-white/30 text-xs">{entry.label}</span>
            </>
          )}
          {entry.cfg_scale && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
              CFG {entry.cfg_scale}
            </span>
          )}
          {entry.steps && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.05] text-gray-500 dark:text-white/35">
              {entry.steps} steps
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-300 dark:text-white/25 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 dark:text-white/50 text-xs leading-relaxed line-clamp-3">
        {entry.prompt_text}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 5).map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.05] text-gray-400 dark:text-white/30">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-gray-300 dark:text-white/20 text-[10px]">{timeAgo(entry.created_at)}</p>
    </div>
  )
}

export default function PromptLibrarySidebar({ isOpen, onClose }) {
  const [prompts, setPrompts] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPrompts = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/prompts', { params: q ? { q } : {} })
      setPrompts(data)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) fetchPrompts(query)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => fetchPrompts(query), 300)
    return () => clearTimeout(t)
  }, [query, isOpen])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/prompts/${id}`)
      setPrompts((prev) => prev.filter((p) => p.id !== id))
    } catch {}
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[#f8f8fe] dark:bg-[#09091a] border-l border-black/[0.06] dark:border-white/[0.06] z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400 dark:text-white/35" />
                <h2 className="text-gray-900 dark:text-white font-semibold text-sm">Prompt Library</h2>
                <span className="text-gray-300 dark:text-white/25 text-xs">({prompts.length})</span>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="px-3 py-3 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/25" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-gray-800 dark:text-white/80 text-sm placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-ios p-3 pb-safe space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : prompts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3">
                  <BookOpen className="w-10 h-10 text-gray-200 dark:text-white/10 mx-auto" />
                  <p className="text-gray-400 dark:text-white/25 text-sm">
                    {query ? 'No prompts match your search' : 'No saved prompts yet'}
                  </p>
                  {!query && (
                    <p className="text-gray-300 dark:text-white/15 text-xs max-w-[200px] mx-auto leading-relaxed">
                      Click the bookmark icon on any prompt card to save it here
                    </p>
                  )}
                </motion.div>
              ) : (
                prompts.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <LibraryEntry entry={entry} onDelete={handleDelete} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
