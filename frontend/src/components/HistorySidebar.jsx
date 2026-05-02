import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock } from 'lucide-react'

const PLATFORM_COLORS = {
  gemini: 'text-blue-400',
  chatgpt: 'text-emerald-400',
  kling: 'text-violet-400',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function HistorySidebar({ isOpen, onClose, history, onSelect }) {
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
            className="fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-[#09091a] border-l border-white/[0.06] z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/35" />
                <h2 className="text-white font-semibold text-sm">History</h2>
                <span className="text-white/25 text-xs">({history.length})</span>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-white/35 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-ios p-3 pb-safe space-y-2">
              {history.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-white/25 text-sm"
                >
                  No history yet
                </motion.p>
              ) : (
                history.map((entry, i) => (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onSelect(entry)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]">
                      {entry.imagePreview && (
                        <img
                          src={entry.imagePreview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-xs font-semibold capitalize ${PLATFORM_COLORS[entry.platform]}`}
                        >
                          {entry.platform}
                        </span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/30 text-xs">{entry.aspectRatio}</span>
                        {entry.styleModifier && (
                          <>
                            <span className="text-white/20 text-xs">·</span>
                            <span className="text-white/30 text-xs capitalize">
                              {entry.styleModifier}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-white/50 text-xs leading-snug line-clamp-2">
                        {entry.results?.prompts?.[0]?.text?.slice(0, 80)}…
                      </p>
                      <p className="text-white/20 text-xs mt-1">{timeAgo(entry.timestamp)}</p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
