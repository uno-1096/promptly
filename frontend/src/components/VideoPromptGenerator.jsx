import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Video, Sparkles } from 'lucide-react'
import StyleModifiers from './StyleModifiers'

export default function VideoPromptGenerator({
  startingImage,
  onStartingImageChange,
  videoDescription,
  onVideoDescriptionChange,
  styleModifier,
  onStyleModifierChange,
  onGenerate,
  isGenerating,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) return
    onStartingImageChange({ file, preview: URL.createObjectURL(file) })
  }, [onStartingImageChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const removeImage = () => {
    if (startingImage) URL.revokeObjectURL(startingImage.preview)
    onStartingImageChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canGenerate = videoDescription.trim().length > 0

  return (
    <div className="space-y-3">
      {/* Starting frame */}
      <div className="glass-panel overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <Video className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Starting Frame</span>
          <span className="text-xs text-gray-400 dark:text-white/25 ml-auto">Optional</span>
        </div>

        <div className="p-3">
          {startingImage ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/7' }}>
              <img src={startingImage.preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="absolute bottom-2 left-3 text-white/60 text-xs">Starting frame</p>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-violet-400/70 bg-violet-500/10'
                  : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.15] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
              }`}
            >
              <motion.div
                animate={isDragging ? { scale: 1.15, rotate: -8 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-9 h-9 rounded-xl bg-black/[0.05] dark:bg-white/[0.05] flex items-center justify-center"
              >
                <Upload className="w-4 h-4 text-gray-400 dark:text-white/30" />
              </motion.div>
              <p className="text-gray-400 dark:text-white/30 text-sm">Upload a starting frame</p>
              <p className="text-gray-300 dark:text-white/15 text-xs">Sets the visual opening of your video</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* Video description */}
      <div className="glass-panel p-4 space-y-2">
        <label className="text-xs font-semibold text-gray-500 dark:text-white/40 flex items-center gap-1.5">
          <Video className="w-3 h-3 text-violet-500" />
          What happens in the video?
        </label>
        <textarea
          value={videoDescription}
          onChange={(e) => onVideoDescriptionChange(e.target.value)}
          placeholder="e.g., A woman walks down a neon-lit city street at night, her coat flowing in the wind as the camera slowly dollies forward..."
          rows={5}
          className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-gray-800 dark:text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500/50 dark:focus:border-violet-500/40 transition-all placeholder-gray-400 dark:placeholder-white/20 font-sans"
        />
        <p className="text-gray-300 dark:text-white/20 text-xs text-right">{videoDescription.length} chars</p>
      </div>

      <StyleModifiers value={styleModifier} onChange={onStyleModifierChange} />

      <motion.button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        whileTap={canGenerate && !isGenerating ? { scale: 0.98 } : undefined}
        className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
          canGenerate && !isGenerating
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:brightness-110'
            : 'bg-black/[0.05] dark:bg-white/[0.05] text-gray-300 dark:text-white/20 cursor-not-allowed'
        }`}
      >
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Generating...
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Video Prompts
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
