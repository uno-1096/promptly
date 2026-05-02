import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, Play } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'gemini',
    name: 'Gemini',
    tagline: 'Narrative & storytelling',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: '0 0 24px rgba(59,130,246,0.3)',
    Icon: Sparkles,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'Structured & technical',
    gradient: 'from-emerald-500 to-teal-400',
    shadow: '0 0 24px rgba(16,185,129,0.3)',
    Icon: MessageSquare,
  },
  {
    id: 'kling',
    name: 'Kling',
    tagline: 'Video & motion',
    gradient: 'from-violet-500 to-pink-500',
    shadow: '0 0 24px rgba(139,92,246,0.3)',
    Icon: Play,
  },
]

export default function PlatformSelector({ value, onChange }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-3">
        Platform
      </p>
      <div className="grid grid-cols-3 gap-2">
        {PLATFORMS.map(({ id, name, tagline, gradient, shadow, Icon }) => {
          const selected = value === id
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={selected ? { boxShadow: shadow } : {}}
              className={`relative p-3 rounded-xl border text-left overflow-hidden transition-all duration-300 ${
                selected
                  ? 'border-white/20 bg-white/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
              }`}
            >
              <AnimatedBackground show={selected} gradient={gradient} />
              <div className={`relative inline-flex p-1.5 rounded-lg bg-gradient-to-br ${gradient} mb-2.5`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="relative text-white text-xs font-semibold leading-tight">{name}</p>
              <p className="relative text-white/35 text-[10px] mt-0.5 leading-tight">{tagline}</p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function AnimatedBackground({ show, gradient }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.08]`}
    />
  )
}
