import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Edit3 } from 'lucide-react'

const LABELS = ['Faithful', 'Enhanced', 'Creative']
const LABEL_STYLES = [
  'text-blue-300 bg-blue-500/10 border-blue-500/20',
  'text-violet-300 bg-violet-500/10 border-violet-500/20',
  'text-pink-300 bg-pink-500/10 border-pink-500/20',
]

export default function PromptCard({ prompt, index, delay = 0 }) {
  const [text, setText] = useState(prompt.text)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-panel p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${LABEL_STYLES[index]}`}>
            {LABELS[index]}
          </span>
          <span className="text-white/20 text-xs">{text.length} chars</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={toggleEdit}
            whileTap={{ scale: 0.88 }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
              editing
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-white/25 hover:text-white/55 hover:bg-white/[0.05]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.88 }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/25 hover:text-white/55 hover:bg-white/[0.05] transition-colors"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Copy className="w-4 h-4" />
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
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all font-sans"
          />
        ) : (
          <motion.p
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white/65 text-sm leading-relaxed"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>

      {prompt.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {prompt.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/35"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
