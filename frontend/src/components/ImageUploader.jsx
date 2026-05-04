import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon, Type, Plus } from 'lucide-react'

const MAX_IMAGES = 5

export default function ImageUploader({
  images,
  onImagesChange,
  inputMode,
  onInputModeChange,
  textDescription,
  onTextDescriptionChange,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = useCallback(
    (files) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      const newImages = imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }))
      onImagesChange((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES))
    },
    [onImagesChange],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleRemove = (index) => {
    onImagesChange((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const handleClearAll = () => {
    onImagesChange((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview))
      return []
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="glass-panel overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-black/[0.06] dark:border-white/[0.06]">
        {[
          { id: 'image', label: 'Image Upload', Icon: ImageIcon },
          { id: 'text', label: 'Text to Prompt', Icon: Type },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onInputModeChange(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all border-b-2 -mb-px ${
              inputMode === id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/55'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'image' ? (
          <motion.div
            key="image-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {images.length === 0 ? (
              <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                className={`h-52 m-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? 'border-violet-400/70 bg-violet-500/10'
                    : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.15] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
              >
                <motion.div
                  animate={isDragging ? { scale: 1.15, rotate: -8 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-12 h-12 rounded-2xl bg-black/[0.05] dark:bg-white/[0.05] flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 text-gray-400 dark:text-white/30" />
                </motion.div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-white/50 text-sm font-medium">
                    {isDragging ? 'Drop images here' : 'Tap or drop to upload'}
                  </p>
                  <p className="text-gray-400 dark:text-white/25 text-xs mt-1">
                    Up to {MAX_IMAGES} images · PNG, JPG, WebP, GIF
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {images.map((img, i) => (
                    <motion.div
                      key={img.preview}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden bg-black/10 dark:bg-white/[0.04]"
                      style={{ aspectRatio: images.length === 1 ? '16/7' : '1/1' }}
                    >
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                        <span className="text-white/70 text-[10px] truncate max-w-[80px]">
                          {images.length > 1 ? `Image ${i + 1}` : img.name}
                        </span>
                        <button
                          onClick={() => handleRemove(i)}
                          className="flex items-center justify-center w-6 h-6 rounded-lg bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {images.length < MAX_IMAGES && (
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] hover:border-violet-400/50 hover:bg-violet-500/[0.05] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-white/25 hover:text-violet-500 dark:hover:text-violet-400"
                      style={{ minHeight: images.length === 0 ? 200 : 80 }}
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[11px] font-medium">Add more</span>
                    </button>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex items-center justify-between px-1 pb-1">
                    <p className="text-gray-400 dark:text-white/30 text-xs">
                      {images.length} of {MAX_IMAGES} images · will generate in parallel
                    </p>
                    <button
                      onClick={handleClearAll}
                      className="text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/50 text-xs transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="text-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-3"
          >
            <textarea
              value={textDescription}
              onChange={(e) => onTextDescriptionChange(e.target.value)}
              placeholder="Describe the image you want to generate prompts for…&#10;e.g. 'A lone lighthouse on a rocky cliff at sunset, with dramatic orange clouds and crashing waves below.'"
              rows={7}
              className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-gray-800 dark:text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500/50 dark:focus:border-violet-500/40 transition-all placeholder-gray-400 dark:placeholder-white/20 font-sans"
            />
            <p className="text-gray-300 dark:text-white/20 text-xs mt-1.5 text-right">{textDescription.length} chars</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
