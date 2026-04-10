import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * DocumentViewer
 *
 * Renders the document as closely as possible to its original appearance:
 *  - PDF  → pdf.js canvas rendering, one canvas per page
 *  - PPTX → slide cards with title + bullet layout
 *  - DOCX/TXT/other → clean paragraph cards
 *
 * Props:
 *  file         File object
 *  lines        string[] – the same lines array the speech engine uses
 *  currentLine  number   – which line is active (-1 = none)
 *  onLineClick  (idx) => void
 */
export default function DocumentViewer({ file, lines, currentLine, onLineClick }) {
  const ext = file?.name.split('.').pop().toLowerCase()

  if (ext === 'pdf') {
    return <PdfViewer file={file} lines={lines} currentLine={currentLine} onLineClick={onLineClick} />
  }

  // PPTX, DOCX, TXT, MD, HTML, CSV – all use the card viewer
  return <CardViewer lines={lines} currentLine={currentLine} onLineClick={onLineClick} ext={ext} />
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF viewer – renders each page on a <canvas> and overlays a highlight strip
// on the active text row.
// ─────────────────────────────────────────────────────────────────────────────
function PdfViewer({ file, lines, currentLine, onLineClick }) {
  const containerRef = useRef(null)
  const [pages, setPages] = useState([])          // array of pdf page objects
  const [pdfDoc, setPdfDoc] = useState(null)
  const [scale, setScale] = useState(1.4)
  const activeRef = useRef(null)

  // Load the PDF document once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href
      const buf = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: buf }).promise
      if (cancelled) return
      setPdfDoc(pdf)
      const ps = []
      for (let i = 1; i <= pdf.numPages; i++) {
        ps.push(await pdf.getPage(i))
      }
      if (!cancelled) setPages(ps)
    })()
    return () => { cancelled = true }
  }, [file])

  // Auto-scroll active line into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLine])

  if (!pdfDoc) {
    return <div className="viewer-loading"><div className="spinner" /><span>Rendering PDF…</span></div>
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      {pages.map((page, pageIdx) => (
        <PdfPage
          key={pageIdx}
          page={page}
          pageIndex={pageIdx}
          scale={scale}
          lines={lines}
          currentLine={currentLine}
          onLineClick={onLineClick}
          activeRef={activeRef}
        />
      ))}
    </div>
  )
}

function PdfPage({ page, pageIndex, scale, lines, currentLine, onLineClick, activeRef }) {
  const canvasRef = useRef(null)
  const [textItems, setTextItems]  = useState([])
  const [viewport, setViewport]    = useState(null)
  const renderTaskRef = useRef(null)

  useEffect(() => {
    const vp = page.getViewport({ scale })
    setViewport(vp)
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = vp.width
    canvas.height = vp.height
    const ctx = canvas.getContext('2d')

    // Cancel any in-progress render before starting a new one
    if (renderTaskRef.current) renderTaskRef.current.cancel()
    const task = page.render({ canvasContext: ctx, viewport: vp })
    renderTaskRef.current = task
    task.promise.catch(() => {}) // ignore cancellation errors

    // Also fetch text items for hit-testing lines
    page.getTextContent().then((tc) => setTextItems(tc.items))

    return () => { if (renderTaskRef.current) renderTaskRef.current.cancel() }
  }, [page, scale])

  // Map a line index to a bounding box on this canvas (in canvas pixels)
  // We match lines by their text content against text items on this page
  const getLineBbox = useCallback((lineIdx) => {
    if (!viewport || textItems.length === 0) return null
    const lineText = lines[lineIdx]?.trim()
    if (!lineText) return null

    // Find the text item(s) whose text starts with / contains this line
    const matching = textItems.filter((item) =>
      'str' in item && item.str.trim() && lineText.startsWith(item.str.trim()),
    )
    if (matching.length === 0) return null

    const item = matching[0]
    const [, , , , x, y] = item.transform
    const h = item.height * scale
    const canvasY = viewport.height - y * scale - h

    return { top: canvasY - 3, height: h + 6, left: 0, width: viewport.width }
  }, [textItems, viewport, lines, scale])

  // Which lines belong to this page (between page separators)
  const pageLineIndices = []
  let inPage = pageIndex === 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('──')) {
      const m = lines[i].match(/Page (\d+)/)
      if (m) inPage = parseInt(m[1], 10) - 1 === pageIndex
      continue
    }
    if (inPage) pageLineIndices.push(i)
  }

  if (!viewport) return null

  return (
    <div className="pdf-page-wrap" style={{ width: viewport.width }}>
      <canvas ref={canvasRef} className="pdf-canvas" />

      {/* Click-target strips for each line on this page */}
      {pageLineIndices.map((lineIdx) => {
        const bbox = getLineBbox(lineIdx)
        if (!bbox) return null
        const isActive = lineIdx === currentLine
        return (
          <div
            key={lineIdx}
            ref={isActive ? activeRef : null}
            className={`pdf-line-hit${isActive ? ' active' : ''}`}
            style={{
              top: bbox.top,
              left: bbox.left,
              width: bbox.width,
              height: bbox.height,
            }}
            onClick={() => onLineClick(lineIdx)}
            title="Click to read from here"
          />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card viewer – PPTX slides / DOCX paragraphs / plain text
// ─────────────────────────────────────────────────────────────────────────────
function CardViewer({ lines, currentLine, onLineClick, ext }) {
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLine])

  // Group lines into sections split by '──' separators
  const sections = []
  let current = { label: null, items: [] }
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('──')) {
      sections.push({ ...current })
      current = { label: lines[i], items: [], startIdx: i + 1 }
    } else {
      if (!current.startIdx && current.startIdx !== 0) current.startIdx = i
      current.items.push({ text: lines[i], idx: i })
    }
  }
  if (current.items.length > 0) sections.push(current)

  const isPptx = ext === 'pptx'

  return (
    <div className="card-viewer">
      {sections.map((section, si) => (
        <div key={si} className={`doc-card${isPptx ? ' slide-card' : ''}`}>
          {section.label && (
            <div className="card-divider">{section.label}</div>
          )}
          <div className="card-body">
            {section.items.map(({ text, idx }, itemIdx) => {
              const isActive = idx === currentLine
              // PPTX: treat the first item in each card as a title
              const isTitle = isPptx && itemIdx === 0
              return (
                <p
                  key={idx}
                  ref={isActive ? activeRef : null}
                  className={`card-line${isActive ? ' active' : ''}${isTitle ? ' slide-title' : ''}`}
                  onClick={() => onLineClick(idx)}
                  title="Click to read from here"
                >
                  {text}
                </p>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
