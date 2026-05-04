import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Header from './components/Header'
import ImageUploader from './components/ImageUploader'
import PlatformSelector from './components/PlatformSelector'
import AspectRatioSelector from './components/AspectRatioSelector'
import StyleModifiers from './components/StyleModifiers'
import PromptLengthSlider from './components/PromptLengthSlider'
import GenerateButton from './components/GenerateButton'
import PromptResults from './components/PromptResults'
import HistorySidebar from './components/HistorySidebar'
import PromptLibrarySidebar from './components/PromptLibrarySidebar'
import ModeSwitcher from './components/ModeSwitcher'
import ReferenceAssembly from './components/ReferenceAssembly'
import ReferenceResults from './components/ReferenceResults'
import VideoPromptGenerator from './components/VideoPromptGenerator'
import VideoResults from './components/VideoResults'

const HISTORY_KEY = 'promptly_history'
const THEME_KEY = 'promptly_theme'
const MAX_HISTORY = 10

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) !== 'light' } catch { return true }
  })

  // App mode: 'image' | 'reference' | 'video'
  const [appMode, setAppMode] = useState('image')

  // Image Prompts state
  const [inputMode, setInputMode] = useState('image')
  const [images, setImages] = useState([])
  const [textDescription, setTextDescription] = useState('')
  const [platform, setPlatform] = useState('gemini')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [styleModifier, setStyleModifier] = useState('')
  const [promptLength, setPromptLength] = useState('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState(null)
  const [batchLabels, setBatchLabels] = useState(null)
  const [error, setError] = useState(null)

  // History / Library state
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  // Reference Assembly state
  const [refImages, setRefImages] = useState([])
  const [sceneDescription, setSceneDescription] = useState('')
  const [refAspectRatio, setRefAspectRatio] = useState('1:1')
  const [refStyleModifier, setRefStyleModifier] = useState('')
  const [isRefGenerating, setIsRefGenerating] = useState(false)
  const [referenceResult, setReferenceResult] = useState(null)
  const [refError, setRefError] = useState(null)

  // Video Prompt state
  const [startingImage, setStartingImage] = useState(null)
  const [videoDescription, setVideoDescription] = useState('')
  const [videoStyleModifier, setVideoStyleModifier] = useState('')
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [videoResult, setVideoResult] = useState(null)
  const [videoError, setVideoError] = useState(null)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  useEffect(() => {
    const splash = document.getElementById('splash')
    if (splash) {
      splash.classList.add('splash-out')
      const t = setTimeout(() => splash.remove(), 450)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  const canGenerate = inputMode === 'image' ? images.length > 0 : textDescription.trim().length > 0

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setError(null)
    setResults(null)
    setBatchLabels(null)

    try {
      if (inputMode === 'text') {
        const fd = new FormData()
        fd.append('description', textDescription)
        fd.append('platform', platform)
        fd.append('aspect_ratio', aspectRatio)
        fd.append('style_modifier', styleModifier)
        fd.append('prompt_length', promptLength)
        const { data } = await axios.post('/api/analyze/text', fd)
        setResults([data])
        _saveHistory({ results: [data], imagePreview: null })
      } else if (images.length === 1) {
        const fd = new FormData()
        fd.append('image', images[0].file)
        fd.append('platform', platform)
        fd.append('aspect_ratio', aspectRatio)
        fd.append('style_modifier', styleModifier)
        fd.append('prompt_length', promptLength)
        const { data } = await axios.post('/api/analyze', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setResults([data])
        _saveHistory({ results: [data], imagePreview: images[0].preview })
      } else {
        const responses = await Promise.all(
          images.map((img) => {
            const fd = new FormData()
            fd.append('image', img.file)
            fd.append('platform', platform)
            fd.append('aspect_ratio', aspectRatio)
            fd.append('style_modifier', styleModifier)
            fd.append('prompt_length', promptLength)
            return axios.post('/api/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          })
        )
        const batchResults = responses.map((r) => r.data)
        const labels = images.map((img) => img.name)
        setResults(batchResults)
        setBatchLabels(labels)
        _saveHistory({ results: batchResults, imagePreview: images[0].preview, batchLabels: labels })
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerate, inputMode, images, textDescription, platform, aspectRatio, styleModifier, promptLength])

  const _saveHistory = ({ results: r, imagePreview, batchLabels: bl }) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      imagePreview,
      platform,
      aspectRatio,
      styleModifier,
      promptLength,
      inputMode,
      results: r,
      batchLabels: bl || null,
    }
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const loadHistoryEntry = (entry) => {
    setResults(entry.results)
    setBatchLabels(entry.batchLabels || null)
    setPlatform(entry.platform)
    setAspectRatio(entry.aspectRatio)
    setStyleModifier(entry.styleModifier || '')
    setShowHistory(false)
    setAppMode('image')
  }

  const handleSavePrompt = async (promptData) => {
    const fd = new FormData()
    fd.append('platform', platform)
    fd.append('label', promptData.label || '')
    fd.append('prompt_text', promptData.text)
    fd.append('tags', JSON.stringify(promptData.tags || []))
    fd.append('negative_prompt', promptData.negative_prompt || '')
    if (promptData.cfg_scale) fd.append('cfg_scale', String(promptData.cfg_scale))
    if (promptData.sampler) fd.append('sampler', promptData.sampler)
    if (promptData.steps) fd.append('steps', String(promptData.steps))
    fd.append('lora_tags', JSON.stringify(promptData.lora_tags || []))
    await axios.post('/api/prompts/save', fd)
  }

  const handleReferenceGenerate = useCallback(async () => {
    if (refImages.length === 0 || !sceneDescription.trim()) return
    setIsRefGenerating(true)
    setRefError(null)
    setReferenceResult(null)

    try {
      const fd = new FormData()
      refImages.forEach((img) => fd.append('images', img.file))
      fd.append('scene_description', sceneDescription)
      fd.append('aspect_ratio', refAspectRatio)
      fd.append('style_modifier', refStyleModifier)
      const { data } = await axios.post('/api/analyze/reference', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setReferenceResult(data)
    } catch (err) {
      setRefError(err.response?.data?.detail || err.message || 'Something went wrong')
    } finally {
      setIsRefGenerating(false)
    }
  }, [refImages, sceneDescription, refAspectRatio, refStyleModifier])

  const handleVideoGenerate = useCallback(async () => {
    if (!videoDescription.trim()) return
    setIsVideoGenerating(true)
    setVideoError(null)
    setVideoResult(null)

    try {
      const fd = new FormData()
      fd.append('video_description', videoDescription)
      if (startingImage) fd.append('starting_image', startingImage.file)
      fd.append('style_modifier', videoStyleModifier)
      const { data } = await axios.post('/api/analyze/video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setVideoResult(data)
    } catch (err) {
      setVideoError(err.response?.data?.detail || err.message || 'Something went wrong')
    } finally {
      setIsVideoGenerating(false)
    }
  }, [startingImage, videoDescription, videoStyleModifier])

  return (
    <div className="min-h-screen relative bg-[#f4f4fb] dark:bg-[#06060f] transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-violet-500/[0.10] dark:bg-violet-600/[0.18] rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.07] dark:bg-blue-600/[0.12] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/[0.06] dark:bg-indigo-600/[0.08] rounded-full blur-[96px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          historyCount={history.length}
          onHistoryToggle={() => setShowHistory((s) => !s)}
          onLibraryToggle={() => setShowLibrary((s) => !s)}
          isDark={isDark}
          onThemeToggle={() => setIsDark((d) => !d)}
        />

        <main className="flex-1 px-4 md:px-8 py-4 md:py-6 pb-safe max-w-7xl mx-auto w-full">
          <ModeSwitcher mode={appMode} onChange={setAppMode} />

          <AnimatePresence mode="wait">
            {appMode === 'image' && (
              <motion.div
                key="image"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  <div className="w-full lg:w-[480px] flex-shrink-0 space-y-3">
                    <ImageUploader
                      images={images}
                      onImagesChange={setImages}
                      inputMode={inputMode}
                      onInputModeChange={setInputMode}
                      textDescription={textDescription}
                      onTextDescriptionChange={setTextDescription}
                    />
                    <PlatformSelector value={platform} onChange={setPlatform} />
                    <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
                    <StyleModifiers value={styleModifier} onChange={setStyleModifier} />
                    <PromptLengthSlider value={promptLength} onChange={setPromptLength} />
                    <GenerateButton onClick={handleGenerate} isGenerating={isGenerating} disabled={!canGenerate} />

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 dark:text-red-300 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1 min-w-0">
                    <PromptResults
                      results={results}
                      batchLabels={batchLabels}
                      isLoading={isGenerating}
                      platform={platform}
                      onSavePrompt={handleSavePrompt}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {appMode === 'reference' && (
              <motion.div
                key="reference"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  <div className="w-full lg:w-[480px] flex-shrink-0 space-y-3">
                    <ReferenceAssembly
                      refImages={refImages}
                      onRefImagesChange={setRefImages}
                      sceneDescription={sceneDescription}
                      onSceneDescriptionChange={setSceneDescription}
                      aspectRatio={refAspectRatio}
                      onAspectRatioChange={setRefAspectRatio}
                      styleModifier={refStyleModifier}
                      onStyleModifierChange={setRefStyleModifier}
                      onGenerate={handleReferenceGenerate}
                      isGenerating={isRefGenerating}
                    />

                    <AnimatePresence>
                      {refError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 dark:text-red-300 text-sm"
                        >
                          {refError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1 min-w-0">
                    <ReferenceResults result={referenceResult} isLoading={isRefGenerating} />
                  </div>
                </div>
              </motion.div>
            )}

            {appMode === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  <div className="w-full lg:w-[480px] flex-shrink-0 space-y-3">
                    <VideoPromptGenerator
                      startingImage={startingImage}
                      onStartingImageChange={setStartingImage}
                      videoDescription={videoDescription}
                      onVideoDescriptionChange={setVideoDescription}
                      styleModifier={videoStyleModifier}
                      onStyleModifierChange={setVideoStyleModifier}
                      onGenerate={handleVideoGenerate}
                      isGenerating={isVideoGenerating}
                    />

                    <AnimatePresence>
                      {videoError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 dark:text-red-300 text-sm"
                        >
                          {videoError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1 min-w-0">
                    <VideoResults result={videoResult} isLoading={isVideoGenerating} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onSelect={loadHistoryEntry}
      />

      <PromptLibrarySidebar
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
      />
    </div>
  )
}
