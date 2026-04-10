import { useState, useRef, useCallback } from 'react'
import { parseDocument } from '../utils/documentParser'
import ThemeToggle from './ThemeToggle'

const FORMATS = ['PDF', 'DOCX', 'DOC', 'PPTX', 'TXT', 'MD', 'HTML', 'CSV', 'LOG']

export default function FileUpload({ onLoad, theme, toggleTheme }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const process = useCallback(
    async (file) => {
      if (!file) return
      setIsLoading(true)
      setError('')
      setLoadingMsg(`Reading ${file.name}…`)
      try {
        const lines = await parseDocument(file)
        if (lines.length === 0) throw new Error('No readable text found in this document.')
        onLoad(lines, file.name, file)
      } catch (err) {
        setError(err.message ?? 'Failed to parse document.')
      } finally {
        setIsLoading(false)
        setLoadingMsg('')
      }
    },
    [onLoad],
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragOver(false)
      process(e.dataTransfer.files[0])
    },
    [process],
  )

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const onDragLeave = () => setIsDragOver(false)

  const onFileChange = useCallback(
    (e) => {
      process(e.target.files[0])
      e.target.value = ''
    },
    [process],
  )

  return (
    <div className="upload-page">
      <div className="upload-topbar">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <div className="upload-header">
        <div className="upload-logo" aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect x="2"  y="20" width="5" height="12" rx="2.5" fill="currentColor" opacity="0.35"/>
            <rect x="10" y="13" width="5" height="26" rx="2.5" fill="currentColor" opacity="0.55"/>
            <rect x="18" y="6"  width="5" height="40" rx="2.5" fill="currentColor"/>
            <rect x="26" y="10" width="5" height="32" rx="2.5" fill="currentColor"/>
            <rect x="34" y="16" width="5" height="20" rx="2.5" fill="currentColor" opacity="0.65"/>
            <rect x="42" y="21" width="5" height="10" rx="2.5" fill="currentColor" opacity="0.35"/>
          </svg>
        </div>
        <h1>Text<span className="accent">2Speech</span></h1>
        <p className="tagline">Upload any document — hear it read aloud, line by line</p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload document"
        className={`drop-zone${isDragOver ? ' drag-over' : ''}${isLoading ? ' loading' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !isLoading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.txt,.md,.markdown,.html,.htm,.csv,.log,.xml,.json"
          onChange={onFileChange}
          style={{ display: 'none' }}
          tabIndex={-1}
        />

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>{loadingMsg}</p>
          </div>
        ) : (
          <>
            <div className="upload-icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path
                  d="M22 6V30M22 6L13 15M22 6L31 15"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 34V38C5 39.1 5.9 40 7 40H37C38.1 40 39 39.1 39 38V34"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="drop-title">Drop your document here</p>
            <p className="drop-sub">or click to browse files</p>
            <button
              className="browse-btn"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
            >
              Choose File
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4H7V4h2v4z" />
          </svg>
          {error}
        </div>
      )}

      <div className="formats">
        <p>Supported formats</p>
        <div className="format-badges">
          {FORMATS.map((f) => (
            <span key={f} className="badge">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
