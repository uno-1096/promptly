import { motion } from 'framer-motion'

const LENGTHS = [
  { id: 'short', label: 'Short', desc: '40–80w' },
  { id: 'medium', label: 'Medium', desc: '150–300w' },
  { id: 'long', label: 'Long', desc: '350–500w' },
]

export default function PromptLengthSlider({ value, onChange }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-gray-500 dark:text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-3">
        Prompt Length
      </p>
      <div className="grid grid-cols-3 gap-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl p-1">
        {LENGTHS.map(({ id, label, desc }) => {
          const selected = value === id
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.97 }}
              className={`relative py-2 px-1 rounded-lg text-center transition-all duration-200 ${
                selected
                  ? 'bg-white dark:bg-white/[0.09] shadow-sm'
                  : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
              }`}
            >
              <p className={`text-xs font-semibold transition-colors ${
                selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/35'
              }`}>
                {label}
              </p>
              <p className={`text-[10px] transition-colors mt-0.5 ${
                selected ? 'text-gray-500 dark:text-white/45' : 'text-gray-300 dark:text-white/20'
              }`}>
                {desc}
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
