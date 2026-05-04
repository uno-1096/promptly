import { motion } from 'framer-motion'
import { Sparkles, Clock, Sun, Moon, BookOpen } from 'lucide-react'

export default function Header({ historyCount, onHistoryToggle, onLibraryToggle, isDark, onThemeToggle }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="border-b border-black/[0.06] dark:border-white/[0.06] px-4 md:px-8 py-4 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 blur-lg opacity-40 -z-10" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-white">Promptly</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-600 dark:text-violet-300 uppercase tracking-wider">
              beta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            onClick={onThemeToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          <motion.button
            onClick={onLibraryToggle}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-sm font-medium transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </motion.button>

          <motion.button
            onClick={onHistoryToggle}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-sm font-medium transition-all"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
              >
                {historyCount > 9 ? '9+' : historyCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
