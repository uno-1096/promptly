import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Header from './components/Header'
import ImageUploader from './components/ImageUploader'
import PlatformSelector from './components/PlatformSelector'
import AspectRatioSelector from './components/AspectRatioSelector'
import StyleModifiers from './components/StyleModifiers'
import GenerateButton from './components/GenerateButton'
import PromptResults from './components/PromptResults'
import HistorySidebar from './components/HistorySidebar'

const HISTORY_KEY = 'promptly_history'
const MAX_HISTORY = 10

export default function App() {
  const [image, setImage] = useState(null)
  const [platform, setPlatform] = useState('gemini')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [styleModifier, setStyleModifier] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!image?.file) return

    setIsGenerating(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('image', image.file)
    formData.append('platform', platform)
    formData.append('aspect_ratio', aspectRatio)
    formData.append('style_modifier', styleModifier)

    try {
      const { data } = await axios.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResults(data)

      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        imagePreview: image.preview,
        platform,
        aspectRatio,
        styleModifier,
        results: data,
      }

      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, MAX_HISTORY)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
        return updated
      })
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }, [image, platform, aspectRatio, styleModifier])

  const loadHistoryEntry = (entry) => {
    setResults(entry.results)
    setPlatform(entry.platform)
    setAspectRatio(entry.aspectRatio)
    setStyleModifier(entry.styleModifier)
    setShowHistory(false)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background radial glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-violet-600/[0.18] rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/[0.12] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-600/[0.08] rounded-full blur-[96px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header historyCount={history.length} onHistoryToggle={() => setShowHistory((s) => !s)} />

        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Controls column */}
            <div className="w-full lg:w-[480px] flex-shrink-0 space-y-3">
              <ImageUploader image={image} onChange={setImage} />
              <PlatformSelector value={platform} onChange={setPlatform} />
              <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
              <StyleModifiers value={styleModifier} onChange={setStyleModifier} />
              <GenerateButton onClick={handleGenerate} isGenerating={isGenerating} disabled={!image?.file} />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results column */}
            <div className="flex-1 min-w-0">
              <PromptResults results={results} isLoading={isGenerating} platform={platform} />
            </div>
          </div>
        </main>
      </div>

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onSelect={loadHistoryEntry}
      />
    </div>
  )
}
