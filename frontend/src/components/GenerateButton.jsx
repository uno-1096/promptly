import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

const MESSAGES = [
  'Analyzing your input...',
  'Crafting prompt variations...',
  'Optimizing for platform...',
  'Applying style touches...',
  'Almost there...',
]

export default function GenerateButton({ onClick, isGenerating, disabled }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!isGenerating) {
      setMsgIndex(0)
      return
    }
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 2000)
    return () => clearInterval(id)
  }, [isGenerating])

  const isDisabled = disabled || isGenerating

  return (
    <motion.button
      onClick={!isDisabled ? onClick : undefined}
      whileHover={!isDisabled ? { scale: 1.015 } : {}}
      whileTap={!isDisabled ? { scale: 0.985 } : {}}
      className={`relative w-full h-14 rounded-2xl font-semibold text-sm overflow-hidden transition-all duration-300 ${
        disabled
          ? 'opacity-35 cursor-not-allowed bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-gray-400 dark:text-white/40'
          : isGenerating
          ? 'cursor-wait bg-violet-600/15 border border-violet-500/25 text-violet-600 dark:text-violet-200'
          : 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30'
      }`}
    >
      {!disabled && !isGenerating && (
        <div className="absolute inset-0 shimmer-bg animate-shimmer pointer-events-none" />
      )}

      <div className="relative flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5"
            >
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={msgIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {MESSAGES[msgIndex]}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Prompts</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
}
