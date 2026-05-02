import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon } from 'lucide-react'

export default function ImageUploader({ image, onChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) return
      const preview = URL.createObjectURL(file)
      onChange({ file, preview, name: file.name })
    },
    [onChange],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile],
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleRemove = () => {
    if (image?.preview) URL.revokeObjectURL(image.preview)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="glass-panel overflow-hidden">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <AnimatePresence mode="wait">
        {image ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <img src={image.preview} alt="Uploaded" className="w-full h-52 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                <p className="text-white/60 text-xs truncate max-w-[200px]">{image.name}</p>
              </div>
              <motion.button
                onClick={handleRemove}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            className={`h-52 m-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-violet-400/70 bg-violet-500/10'
                : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
            }`}
          >
            <motion.div
              animate={isDragging ? { scale: 1.15, rotate: -8 } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center"
            >
              <Upload className="w-5 h-5 text-white/30" />
            </motion.div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-medium">
                {isDragging ? 'Drop it here' : 'Drop image here'}
              </p>
              <p className="text-white/25 text-xs mt-1">or click to browse</p>
            </div>
            <p className="text-white/15 text-xs">PNG, JPG, WebP, GIF</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
