import { motion } from 'framer-motion'

const RATIOS = [
  { id: '1:1',  label: '1:1',  w: 32, h: 32 },
  { id: '16:9', label: '16:9', w: 48, h: 27 },
  { id: '9:16', label: '9:16', w: 27, h: 48 },
  { id: '4:3',  label: '4:3',  w: 48, h: 36 },
  { id: '3:2',  label: '3:2',  w: 48, h: 32 },
  { id: '21:9', label: '21:9', w: 48, h: 21 },
]

export default function AspectRatioSelector({ value, onChange }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-gray-500 dark:text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-3">
        Aspect Ratio
      </p>
      <div className="grid grid-cols-3 gap-2">
        {RATIOS.map(({ id, label, w, h }) => {
          const selected = value === id
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-center" style={{ width: 52, height: 52 }}>
                <motion.div
                  animate={{
                    boxShadow: selected
                      ? '0 0 0 1.5px rgba(139,92,246,0.8), 0 0 8px rgba(139,92,246,0.2)'
                      : '0 0 0 1px rgba(128,128,128,0.2)',
                  }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-sm transition-colors duration-200 ${
                    selected ? 'bg-violet-500/25' : 'bg-black/[0.07] dark:bg-white/[0.07]'
                  }`}
                  style={{ width: w, height: h }}
                />
              </div>
              <span className={`text-[11px] font-medium transition-colors duration-200 ${
                selected ? 'text-violet-600 dark:text-violet-300' : 'text-gray-400 dark:text-white/35'
              }`}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
