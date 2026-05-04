import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Edit3, Bookmark, BookmarkCheck } from 'lucide-react'

const LABELS = ['Faithful', 'Enhanced', 'Creative']
const LABEL_STYLES = [
  'text-blue-500 dark:text-blue-300 bg-blue-500/10 border-blue-500/20',
  'text-violet-500 dark:text-violet-300 bg-violet-500/10 border-violet-500/20',
  'text-pink-500 dark:text-pink-300 bg-pink-500/10 border-pink-500/20',
]

export default function PromptCard({ prompt, index, delay = 0, onSave }) {
  const [text, setText] = useState(prompt.text)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const ref = useRef(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleEdit = () => {
    setEditing((v) => !v)
    if (!editing) setTimeout(() => ref.current?.focus(), 40)
  }

  const handleSave = async () => {
    if (!onSave) return
    await onSave({
      label: LABELS[index],
      text,
      tags: prompt.tags,
      negative_prompt: prompt.negative_prompt || '',
      cfg_scale: prompt.cfg_scale,
      sampler: prompt.sampler,
      steps: prompt.steps,
      lora_tags: prompt.lora_tags,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isSD = !!(prompt.cfg_scale || prompt.sampler || prompt.steps)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-panel p-4 flex flex-col gap-3"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${LABEL_STYLES[index]}`}>
            {LABELS[index]}
          </span>
          <span className="text-gray-300 dark:text-white/20 text-xs">{text.length} chars</span>
        </div>
        <div className="flex items-center gap-1">
          {onSave && (
            <motion.button
              onClick={handleSave}
              whileTap={{ scale: 0.88 }}
              title="Save to library"
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                saved
                  ? 'bg-violet-500/20 text-violet-500 dark:text-violet-300'
                  : 'text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/55 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
              }`}
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </motion.button>
          )}
          <motion.button
            onClick={toggleEdit}
            whileTap={{ scale: 0.88 }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
              editing
                ? 'bg-violet-500/20 text-violet-500 dark:text-violet-300'
                : 'text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/55 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.88 }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/55 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Check className="w-4 h-4 text-emerald-500" />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Copy className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Text / editor */}
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.textarea
            key="editor"
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
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

      {/* SD params */}
      {isSD && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.05]">
          {prompt.cfg_scale && (
            <div className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
              <p className="text-gray-400 dark:text-white/30 text-[10px] font-semibold uppercase tracking-wide">CFG</p>
              <p className="text-gray-800 dark:text-white/70 text-sm font-bold">{prompt.cfg_scale}</p>
            </div>
          )}
          {prompt.steps && (
            <div className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
              <p className="text-gray-400 dark:text-white/30 text-[10px] font-semibold uppercase tracking-wide">Steps</p>
              <p className="text-gray-800 dark:text-white/70 text-sm font-bold">{prompt.steps}</p>
            </div>
          )}
          {prompt.sampler && (
            <div className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] col-span-3">
              <p className="text-gray-400 dark:text-white/30 text-[10px] font-semibold uppercase tracking-wide">Sampler</p>
              <p className="text-gray-700 dark:text-white/65 text-xs font-medium mt-0.5">{prompt.sampler}</p>
            </div>
          )}
        </div>
      )}

      {/* LoRA tags */}
      {prompt.lora_tags?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-gray-400 dark:text-white/25 text-[10px] font-semibold uppercase tracking-wide">LoRA Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {prompt.lora_tags.map((tag, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-300 font-mono">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-prompt negative (SD only) */}
      {prompt.negative_prompt && (
        <div className="space-y-1 border-t border-black/[0.05] dark:border-white/[0.05] pt-2">
          <p className="text-gray-400 dark:text-white/25 text-[10px] font-semibold uppercase tracking-wide">Negative</p>
          <p className="text-gray-400 dark:text-white/35 text-xs leading-relaxed">{prompt.negative_prompt}</p>
        </div>
      )}

      {/* Tags */}
      {prompt.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {prompt.tags.map((tag, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-gray-400 dark:text-white/35">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
