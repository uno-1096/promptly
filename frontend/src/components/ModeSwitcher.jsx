import { motion } from 'framer-motion'
import { Sparkles, Layers, Video } from 'lucide-react'

const MODES = [
  { id: 'image', label: 'Image Prompts', icon: Sparkles },
  { id: 'reference', label: 'Reference Assembly', icon: Layers },
  { id: 'video', label: 'Video Prompts', icon: Video },
]

export default function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] mb-5">
      {MODES.map(({ id, label, icon: Icon }) => (
        <motion.button
          key={id}
          onClick={() => onChange(id)}
          className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200 ${
            mode === id
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/55'
          }`}
        >
          {mode === id && (
            <motion.span
              layoutId="mode-pill"
              className="absolute inset-0 rounded-xl bg-white dark:bg-white/10 shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  )
}
