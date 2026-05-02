import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import PromptCard from './PromptCard'

const PLATFORM_LABELS = {
  gemini: 'Gemini',
  chatgpt: 'ChatGPT / DALL-E',
  kling: 'Kling AI',
}

function SkeletonCard() {
  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-white/[0.07] rounded-full animate-pulse" />
        <div className="h-4 w-12 bg-white/[0.04] rounded animate-pulse" />
      </div>
      <div className="space-y-2.5">
        {[100, 83, 91, 78, 95, 72].map((w, i) => (
          <div
            key={i}
            className="h-3 bg-white/[0.06] rounded animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="flex gap-1.5 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-14 bg-white/[0.04] rounded-full animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[420px] text-center px-8"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-6"
      >
        <Sparkles className="w-7 h-7 text-white/20" />
      </motion.div>
      <h3 className="text-white/35 font-medium text-lg mb-2">Your prompts will appear here</h3>
      <p className="text-white/20 text-sm max-w-xs leading-relaxed">
        Upload an image, choose your platform, and hit Generate to create AI-optimized prompts
      </p>
    </motion.div>
  )
}

export default function PromptResults({ results, isLoading, platform }) {
  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="h-5 w-36 bg-white/[0.07] rounded animate-pulse mb-5" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </motion.div>
        ) : results ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="mb-5">
              <h2 className="text-white font-semibold text-lg">Generated Prompts</h2>
              <p className="text-white/35 text-xs mt-1">
                Optimized for{' '}
                <span className="text-violet-400 font-medium">{PLATFORM_LABELS[platform]}</span>
              </p>
            </div>

            {results.prompts?.map((prompt, i) => (
              <PromptCard key={i} prompt={prompt} index={i} delay={i * 0.08} />
            ))}

            {results.negative_prompt && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-panel p-4"
              >
                <p className="text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-2">
                  Negative Prompt
                </p>
                <p className="text-white/45 text-sm leading-relaxed">{results.negative_prompt}</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
