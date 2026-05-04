import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import PromptCard from './PromptCard'

const PLATFORM_LABELS = {
  gemini: 'Gemini',
  chatgpt: 'ChatGPT / DALL-E',
  kling: 'Kling AI',
  stable_diffusion: 'Stable Diffusion',
}

function SkeletonCard() {
  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-black/[0.07] dark:bg-white/[0.07] rounded-full animate-pulse" />
        <div className="h-4 w-12 bg-black/[0.04] dark:bg-white/[0.04] rounded animate-pulse" />
      </div>
      <div className="space-y-2.5">
        {[100, 83, 91, 78, 95, 72].map((w, i) => (
          <div
            key={i}
            className="h-3 bg-black/[0.06] dark:bg-white/[0.06] rounded animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="flex gap-1.5 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-14 bg-black/[0.04] dark:bg-white/[0.04] rounded-full animate-pulse" />
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
        className="w-16 h-16 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.07] flex items-center justify-center mb-6"
      >
        <Sparkles className="w-7 h-7 text-gray-300 dark:text-white/20" />
      </motion.div>
      <h3 className="text-gray-400 dark:text-white/35 font-medium text-lg mb-2">Your prompts will appear here</h3>
      <p className="text-gray-300 dark:text-white/20 text-sm max-w-xs leading-relaxed">
        Upload an image or describe a scene, choose your platform, and hit Generate
      </p>
    </motion.div>
  )
}

function ResultSet({ result, platform, onSave }) {
  return (
    <div className="space-y-4">
      {result.prompts?.map((prompt, i) => (
        <PromptCard
          key={i}
          prompt={prompt}
          index={i}
          delay={i * 0.08}
          onSave={onSave}
        />
      ))}

      {result.negative_prompt && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-4"
        >
          <p className="text-gray-400 dark:text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-2">
            {platform === 'stable_diffusion' ? 'Global Negative Prompt' : 'Negative Prompt'}
          </p>
          <p className="text-gray-500 dark:text-white/45 text-sm leading-relaxed">{result.negative_prompt}</p>
        </motion.div>
      )}
    </div>
  )
}

export default function PromptResults({ results, batchLabels, isLoading, platform, onSavePrompt }) {
  const [activeTab, setActiveTab] = useState(0)

  const isBatch = results && results.length > 1
  const activeResult = results?.[activeTab] ?? results?.[0]

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="h-5 w-36 bg-black/[0.07] dark:bg-white/[0.07] rounded animate-pulse mb-5" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </motion.div>
        ) : results ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="mb-2">
              <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Generated Prompts</h2>
              <p className="text-gray-400 dark:text-white/35 text-xs mt-1">
                Optimized for{' '}
                <span className="text-violet-600 dark:text-violet-400 font-medium">{PLATFORM_LABELS[platform] || platform}</span>
                {isBatch && <span className="ml-1">· {results.length} images</span>}
              </p>
            </div>

            {isBatch && (
              <div className="flex gap-1.5 flex-wrap">
                {results.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === i
                        ? 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/30'
                        : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-500 dark:text-white/40 border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {batchLabels?.[i]
                      ? batchLabels[i].replace(/\.[^/.]+$/, '').slice(0, 14)
                      : `Image ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {activeResult && (
                  <ResultSet result={activeResult} platform={platform} onSave={onSavePrompt} />
                )}
              </motion.div>
            </AnimatePresence>
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
