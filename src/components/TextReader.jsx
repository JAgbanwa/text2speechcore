import { useState, useEffect, useRef, useCallback } from 'react'
import { SpeechEngine } from '../utils/SpeechEngine'

// Icons as tiny inline SVGs
const IconPlay = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor">
    <path d="M6 3.5L21.5 13 6 22.5V3.5Z" />
  </svg>
)
const IconPause = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor">
    <rect x="5"  y="3" width="5" height="20" rx="2" />
    <rect x="16" y="3" width="5" height="20" rx="2" />
  </svg>
)
const IconStop = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="3" y="3" width="14" height="14" rx="2.5" />
  </svg>
)
const IconPrev = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 3V17M16 3.5L8 10L16 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M15 3V17M4 3.5L12 10L4 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconExpand = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 6V2H6M16 6V2H12M2 12V16H6M16 12V16H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconShrink = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M6 2V6H2M12 2V6H16M6 16V12H2M12 16V12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4L5 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export default function TextReader({ lines, fileName, onReset }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [rate, setRate] = useState(1)
  const [voices, setVoices] = useState([])
  const [voiceIdx, setVoiceIdx] = useState(0)
  const [focusMode, setFocusMode] = useState(false)

  const engineRef = useRef(null)
  const lineRefs = useRef([])
  const listRef = useRef(null)

  // ——————————————————————————————————————————————
  // Engine setup
  // ——————————————————————————————————————————————
  useEffect(() => {
    const engine = new SpeechEngine()
    engine.load(lines)

    engine.onLineChange = (idx) => {
      setCurrentLine(idx)
      setProgress(idx >= 0 ? Math.round(((idx + 1) / lines.length) * 100) : 0)
    }
    engine.onStateChange = (playing) => setIsPlaying(playing)
    engine.onFinish = () => {
      setIsPlaying(false)
      setCurrentLine(-1)
      setProgress(0)
    }

    engineRef.current = engine
    return () => engine.destroy()
  }, [lines])

  // ——————————————————————————————————————————————
  // Voice loading
  // ——————————————————————————————————————————————
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices()
      if (all.length === 0) return
      setVoices(all)
      const engIdx = all.findIndex((v) => v.lang.startsWith('en'))
      const defaultIdx = engIdx >= 0 ? engIdx : 0
      setVoiceIdx(defaultIdx)
      engineRef.current?.setVoice(all[defaultIdx])
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // ——————————————————————————————————————————————
  // Auto-scroll active line into view
  // ——————————————————————————————————————————————
  useEffect(() => {
    if (!focusMode && currentLine >= 0 && lineRefs.current[currentLine]) {
      lineRefs.current[currentLine].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLine, focusMode])

  // ——————————————————————————————————————————————
  // Control handlers
  // ——————————————————————————————————————————————
  const handlePlayPause = useCallback(() => {
    isPlaying ? engineRef.current?.pause() : engineRef.current?.play()
  }, [isPlaying])

  const handleStop    = useCallback(() => engineRef.current?.stop(), [])
  const handlePrev    = useCallback(() => engineRef.current?.prev(), [])
  const handleNext    = useCallback(() => engineRef.current?.next(), [])

  const handleLineClick = useCallback((idx) => {
    engineRef.current?.seekTo(idx)
  }, [])

  const handleRateChange = useCallback((e) => {
    const r = parseFloat(e.target.value)
    setRate(r)
    engineRef.current?.setRate(r)
  }, [])

  const handleVoiceChange = useCallback(
    (e) => {
      const idx = parseInt(e.target.value)
      setVoiceIdx(idx)
      engineRef.current?.setVoice(voices[idx])
    },
    [voices],
  )

  const handleProgressClick = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pct = (e.clientX - rect.left) / rect.width
      const idx = Math.max(0, Math.min(Math.floor(pct * lines.length), lines.length - 1))
      engineRef.current?.seekTo(idx)
    },
    [lines.length],
  )

  // ——————————————————————————————————————————————
  // Render
  // ——————————————————————————————————————————————
  const isSeparator = (l) => l.startsWith('──')

  return (
    <div className={`reader-page${focusMode ? ' focus-mode' : ''}`}>

      {/* ── Header ── */}
      <header className="reader-header">
        <button className="icon-btn back-btn" onClick={onReset} title="Upload new document">
          <IconBack />
          <span>Back</span>
        </button>

        <div className="file-info">
          <span className="file-name" title={fileName}>{fileName}</span>
          <span className="line-count">{lines.length} lines</span>
        </div>

        <button
          className={`icon-btn focus-btn${focusMode ? ' active' : ''}`}
          onClick={() => setFocusMode((f) => !f)}
          title={focusMode ? 'Exit focus mode' : 'Focus mode'}
        >
          {focusMode ? <IconShrink /> : <IconExpand />}
        </button>
      </header>

      {/* ── Focus mode: big centred line ── */}
      {focusMode && (
        <div className="focus-view">
          {currentLine >= 0 ? (
            <>
              <p className="focus-line" key={currentLine}>{lines[currentLine]}</p>
              <p className="focus-counter">{currentLine + 1} / {lines.length}</p>
            </>
          ) : (
            <p className="focus-prompt">Press play to start reading</p>
          )}
        </div>
      )}

      {/* ── Scrollable line list ── */}
      {!focusMode && (
        <div className="lines-list" ref={listRef}>
          {lines.map((line, idx) => (
            <div
              key={idx}
              ref={(el) => (lineRefs.current[idx] = el)}
              className={`line-row${idx === currentLine ? ' active' : ''}${isSeparator(line) ? ' separator' : ''}`}
              onClick={() => !isSeparator(line) && handleLineClick(idx)}
              title={isSeparator(line) ? undefined : 'Click to read from here'}
            >
              <span className="ln">{isSeparator(line) ? '' : idx + 1}</span>
              <span className="lt">{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Controls bar ── */}
      <div className="controls-bar">
        {/* Progress scrubber */}
        <div
          className="scrubber"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={handleProgressClick}
          title={`${progress}% complete`}
        >
          <div className="scrubber-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="controls-inner">
          {/* Transport */}
          <div className="transport">
            <button
              className="ctrl-btn"
              onClick={handlePrev}
              disabled={currentLine <= 0}
              title="Previous line"
              aria-label="Previous line"
            >
              <IconPrev />
            </button>

            <button
              className="ctrl-btn play-btn"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>

            <button
              className="ctrl-btn"
              onClick={handleStop}
              title="Stop"
              aria-label="Stop"
            >
              <IconStop />
            </button>

            <button
              className="ctrl-btn"
              onClick={handleNext}
              disabled={currentLine >= lines.length - 1}
              title="Next line"
              aria-label="Next line"
            >
              <IconNext />
            </button>
          </div>

          {/* Settings */}
          <div className="settings">
            <label className="setting-label">
              Speed
              <strong className="accent-text">{rate.toFixed(1)}×</strong>
              <input
                type="range"
                className="slider"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={handleRateChange}
                aria-label="Playback speed"
              />
            </label>

            {voices.length > 0 && (
              <label className="setting-label voice-label">
                Voice
                <select
                  className="voice-select"
                  value={voiceIdx}
                  onChange={handleVoiceChange}
                  aria-label="Select voice"
                >
                  {voices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
