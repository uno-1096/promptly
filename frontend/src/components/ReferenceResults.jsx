import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Edit3, Layers, Camera } from 'lucide-react'

const PLATFORM_STYLES = {
  gemini: {
    label: 'Gemini',
    color: 'text-blue-500 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  chatgpt: {
    label: 'ChatGPT / DALL-E',
    color: 'text-emerald-500 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  kling: {
    label: 'Kling',
    color: 'text-violet-500 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    dot: 'bg-violet-500',
  },
  stable_diffusion: {
    label: 'Stable Diffusion',
    color: 'text-orange-500 dark:text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
  },
}

function PlatformPromptCard({ platformKey, data, delay }) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(data.prompt)
  const style = PLATFORM_STYLES[platformKey]
  const isSD = platformKey === 'stable_diffusion'
  const isKling = platformKey === 'kling'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-panel p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.color}`}>
            {style.label}
          </span>
          <span className="text-gray-300 dark:text-white/20 text-xs">{text.length} chars</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => setEditing((v) => !v)}
            whileTap={{ scale: 0.88 }}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
              editing
                ? 'bg-violet-500/20 text-violet-500 dark:text-violet-300'
                : 'text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/55 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.88 }}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/55 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Copy className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.textarea
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-gray-800 dark:text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500/40 transition-all font-sans"
          />
        ) : (
          <motion.p
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-600 dark:text-white/65 text-sm leading-relaxed"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>

      {isKling && data.camera_movement && (
        <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-300 bg-violet-500/10 rounded-lg px-3 py-1.5">
          <Camera className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold">Camera:</span>
          <span>{data.camera_movement}</span>
        </div>
      )}

      {isSD && (
        <>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.05]">
            {data.cfg_scale && (
              <div className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
                <p className="text-gray-400 dark:text-white/30 text-[10px] font-semibold uppercase tracking-wide">CFG</p>
                <p className="text-gray-800 dark:text-white/70 text-sm font-bold">{data.cfg_scale}</p>
              </div>
            )}
            {data.steps && (
              <div className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
                <p className="text-gray-400 dark:text-white/30 text-[10px] font-semibold uppercase tracking-wide">Steps</p>
                <p className="text-gray-800 dark:text-white/70 text-sm font-bold">{data.steps}</p>
              </div>
            )}
            {data.sampler && (
              <div className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] col-span-3">
                <p className="text-gray-400 dark:text-white/30 text-[10px] font-semibold uppercase tracking-wide">Sampler</p>
                <p className="text-gray-700 dark:text-white/65 text-xs font-medium mt-0.5">{data.sampler}</p>
              </div>
            )}
          </div>
          {data.lora_tags?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-gray-400 dark:text-white/25 text-[10px] font-semibold uppercase tracking-wide">LoRA Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {data.lora_tags.map((tag, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-300 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.negative_prompt && (
            <div className="space-y-1 border-t border-black/[0.05] dark:border-white/[0.05] pt-2">
              <p className="text-gray-400 dark:text-white/25 text-[10px] font-semibold uppercase tracking-wide">Negative</p>
              <p className="text-gray-400 dark:text-white/35 text-xs leading-relaxed">{data.negative_prompt}</p>
            </div>
          )}
        </>
      )}

      {data.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.tags.map((tag, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-gray-400 dark:text-white/35">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function ReferenceResults({ result, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-52 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-4 space-y-3 animate-pulse">
            <div className="h-4 w-36 rounded-full bg-black/[0.06] dark:bg-white/[0.06]" />
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.04]" />
              <div className="h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.04] w-4/5" />
              <div className="h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.04] w-3/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center px-8">
        <div className="w-16 h-16 rounded-3xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-4">
          <Layers className="w-7 h-7 text-gray-300 dark:text-white/15" />
        </div>
        <p className="text-gray-400 dark:text-white/30 text-sm font-medium">Upload references and describe your scene</p>
        <p className="text-gray-300 dark:text-white/20 text-xs mt-1.5 max-w-xs">
          Claude will analyze all images together and generate a unified prompt for all 4 platforms
        </p>
      </div>
    )
  }

  const platforms = ['gemini', 'chatgpt', 'kling', 'stable_diffusion']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-white/60">Reference Assembly — All Platforms</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {platforms.map((key, i) =>
          result[key] ? (
            <PlatformPromptCard key={key} platformKey={key} data={result[key]} delay={i * 0.08} />
          ) : null
        )}
      </div>

      {result.negative_prompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4"
        >
          <p className="text-gray-400 dark:text-white/25 text-[10px] font-semibold uppercase tracking-wide mb-1.5">
            Global Negative Prompt
          </p>
          <p className="text-gray-500 dark:text-white/45 text-sm leading-relaxed">{result.negative_prompt}</p>
        </motion.div>
      )}
    </div>
  )
}
