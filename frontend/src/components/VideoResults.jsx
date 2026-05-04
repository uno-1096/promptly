import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Video, Camera, Zap, Sun, Layers, Clock } from 'lucide-react'

const PLATFORM_STYLES = {
  kling: {
    label: 'Kling AI',
    color: 'text-violet-500 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    dot: 'bg-violet-500',
  },
  sora: {
    label: 'Sora (OpenAI)',
    color: 'text-blue-500 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  runway: {
    label: 'Runway Gen-3',
    color: 'text-emerald-500 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  pika: {
    label: 'Pika Labs',
    color: 'text-pink-500 dark:text-pink-300',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    dot: 'bg-pink-500',
  },
}

function MetaBadge({ icon: Icon, label, value, colorClass }) {
  return (
    <div className={`flex items-start gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${colorClass}`}>
      <Icon className="w-3 h-3 flex-shrink-0 mt-px" />
      <span>
        <span className="font-semibold">{label}:</span> {value}
      </span>
    </div>
  )
}

function VideoPlatformCard({ platformKey, data, delay }) {
  const [copied, setCopied] = useState(false)
  const style = PLATFORM_STYLES[platformKey]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.prompt)
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
          {data.duration && (
            <span className="flex items-center gap-1 text-gray-400 dark:text-white/25 text-xs">
              <Clock className="w-3 h-3" />
              {data.duration}
            </span>
          )}
        </div>
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

      <p className="text-gray-600 dark:text-white/65 text-sm leading-relaxed">{data.prompt}</p>

      <div className="flex flex-col gap-1.5 pt-1 border-t border-black/[0.05] dark:border-white/[0.05]">
        {data.camera_movement && (
          <MetaBadge icon={Camera} label="Camera" value={data.camera_movement} colorClass="bg-violet-500/[0.08] text-violet-600 dark:text-violet-300" />
        )}
        {data.subject_motion && (
          <MetaBadge icon={Zap} label="Motion" value={data.subject_motion} colorClass="bg-blue-500/[0.08] text-blue-600 dark:text-blue-300" />
        )}
        {data.lighting && (
          <MetaBadge icon={Sun} label="Lighting" value={data.lighting} colorClass="bg-amber-500/[0.08] text-amber-600 dark:text-amber-300" />
        )}
        {data.transitions && (
          <MetaBadge icon={Layers} label="Transition" value={data.transitions} colorClass="bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-300" />
        )}
      </div>

      {data.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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

export default function VideoResults({ result, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-52 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-4 space-y-3 animate-pulse">
            <div className="h-4 w-32 rounded-full bg-black/[0.06] dark:bg-white/[0.06]" />
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.04]" />
              <div className="h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.04] w-4/5" />
              <div className="h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.04] w-2/3" />
            </div>
            <div className="space-y-1.5">
              <div className="h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.04]" />
              <div className="h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.04]" />
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
          <Video className="w-7 h-7 text-gray-300 dark:text-white/15" />
        </div>
        <p className="text-gray-400 dark:text-white/30 text-sm font-medium">Describe your video to get started</p>
        <p className="text-gray-300 dark:text-white/20 text-xs mt-1.5 max-w-xs">
          Optimized prompts for Kling, Sora, Runway, and Pika — with camera movement, motion, lighting, and duration
        </p>
      </div>
    )
  }

  const platforms = ['kling', 'sora', 'runway', 'pika']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-white/60">Video Prompts — All Platforms</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {platforms.map((key, i) =>
          result[key] ? (
            <VideoPlatformCard key={key} platformKey={key} data={result[key]} delay={i * 0.08} />
          ) : null
        )}
      </div>
    </div>
  )
}
