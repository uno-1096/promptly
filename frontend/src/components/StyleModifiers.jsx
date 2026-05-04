import { motion, AnimatePresence } from 'framer-motion'

const STYLES = [
  { id: 'cinematic',      label: 'Cinematic' },
  { id: 'photorealistic', label: 'Photorealistic' },
  { id: 'anime',          label: 'Anime' },
  { id: 'illustration',   label: 'Illustration' },
  { id: 'abstract',       label: 'Abstract' },
  { id: 'portrait',       label: 'Portrait' },
]

export default function StyleModifiers({ value, onChange }) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 dark:text-white/35 text-[11px] font-semibold uppercase tracking-widest">
          Style Modifier
        </p>
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="px-2 py-1 text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/50 text-xs transition-colors rounded-lg"
            >
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap gap-2">
        {STYLES.map(({ id, label }) => {
          const selected = value === id
          return (
            <motion.button
              key={id}
              onClick={() => onChange(selected ? '' : id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200 ${
                selected
                  ? 'border-violet-500/50 bg-violet-500/20 text-violet-600 dark:text-violet-200 shadow-sm shadow-violet-500/20'
                  : 'border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/65 hover:border-black/15 dark:hover:border-white/15'
              }`}
            >
              {label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
