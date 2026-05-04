import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Plus, Layers, Sparkles } from 'lucide-react'
import AspectRatioSelector from './AspectRatioSelector'
import StyleModifiers from './StyleModifiers'

const CATEGORIES = ['Person', 'Outfit', 'Location', 'Prop', 'Style', 'Background', 'Lighting', 'Other']
const MAX_REF_IMAGES = 8

export default function ReferenceAssembly({
  refImages,
  onRefImagesChange,
  sceneDescription,
  onSceneDescriptionChange,
  aspectRatio,
  onAspectRatioChange,
  styleModifier,
  onStyleModifierChange,
  onGenerate,
  isGenerating,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    const toAdd = imageFiles.slice(0, MAX_REF_IMAGES - refImages.length).map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      category: 'Person',
    }))
    onRefImagesChange((prev) => [...prev, ...toAdd])
  }, [refImages.length, onRefImagesChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removeImage = (id) => {
    onRefImagesChange((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img) URL.revokeObjectURL(img.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  const updateCategory = (id, category) => {
    onRefImagesChange((prev) => prev.map((img) => img.id === id ? { ...img, category } : img))
  }

  const canGenerate = refImages.length > 0 && sceneDescription.trim().length > 0

  return (
    <div className="space-y-3">
      <div className="glass-panel overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <Layers className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Reference Images</span>
          <span className="text-xs text-gray-400 dark:text-white/25 ml-auto">{refImages.length} / {MAX_REF_IMAGES}</span>
        </div>

        <div className="p-3 space-y-3">
          {refImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {refImages.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-black/10 dark:bg-white/[0.04]">
                    <img src={img.preview} alt={img.category} className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900/80 dark:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <select
                    value={img.category}
                    onChange={(e) => updateCategory(img.id, e.target.value)}
                    className="mt-1 w-full text-[10px] bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded-lg px-1.5 py-0.5 text-gray-500 dark:text-white/40 focus:outline-none truncate cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </motion.div>
              ))}

              {refImages.length < MAX_REF_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] hover:border-violet-400/50 hover:bg-violet-500/[0.05] transition-all flex flex-col items-center justify-center gap-1 text-gray-300 dark:text-white/20 hover:text-violet-500 dark:hover:text-violet-400"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-medium">Add</span>
                </button>
              )}
            </div>
          )}

          {refImages.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-violet-400/70 bg-violet-500/10'
                  : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.15] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
              }`}
            >
              <motion.div
                animate={isDragging ? { scale: 1.15, rotate: -8 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-10 h-10 rounded-2xl bg-black/[0.05] dark:bg-white/[0.05] flex items-center justify-center"
              >
                <Upload className="w-4 h-4 text-gray-400 dark:text-white/30" />
              </motion.div>
              <div className="text-center">
                <p className="text-gray-500 dark:text-white/50 text-sm font-medium">
                  {isDragging ? 'Drop references here' : 'Upload reference images'}
                </p>
                <p className="text-gray-400 dark:text-white/25 text-xs mt-0.5">
                  Up to 8 images · person, outfit, location, props
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-white/40">Scene Description</label>
            <textarea
              value={sceneDescription}
              onChange={(e) => onSceneDescriptionChange(e.target.value)}
              placeholder="e.g., mirror selfie in a mansion, golden hour rooftop, luxury hotel lobby..."
              rows={3}
              className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-gray-800 dark:text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500/50 dark:focus:border-violet-500/40 transition-all placeholder-gray-400 dark:placeholder-white/20 font-sans"
            />
          </div>
        </div>
      </div>

      <AspectRatioSelector value={aspectRatio} onChange={onAspectRatioChange} />
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
              Assembling...
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
              Assemble Reference Prompt
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
