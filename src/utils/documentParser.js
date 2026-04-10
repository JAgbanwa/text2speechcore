/**
 * Parses a File into an array of non-empty text lines.
 * Supports: PDF, DOCX/DOC, PPTX, TXT, MD, HTML, CSV, and any plain-text format.
 */

let _pdfjs = null

async function getPdfjs() {
  if (_pdfjs) return _pdfjs
  _pdfjs = await import('pdfjs-dist')
  // Resolve the worker URL via Vite's URL constructor so it is bundled correctly
  _pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href
  return _pdfjs
}

export async function parseDocument(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  switch (ext) {
    case 'pdf':
      return parsePDF(file)
    case 'docx':
    case 'doc':
      return parseDOCX(file)
    case 'pptx':
      return parsePPTX(file)
    case 'html':
    case 'htm':
      return parseHTML(file)
    default:
      // txt, md, markdown, csv, log, json, xml, etc.
      return parseText(file)
  }
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------
async function parsePDF(file) {
  const pdfjs = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const lines = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Group text items by rounded y-coordinate (= visual row on the page)
    const rowMap = new Map()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      if (!rowMap.has(y)) rowMap.set(y, [])
      rowMap.get(y).push(item.str)
    }

    // Sort rows top → bottom (higher y = higher on page in PDF coordinates)
    const sortedYs = [...rowMap.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const text = rowMap.get(y).join(' ').replace(/\s+/g, ' ').trim()
      if (text) lines.push(text)
    }

    if (p < pdf.numPages) lines.push(`── Page ${p + 1} ──`)
  }

  return lines.filter((l) => l.trim().length > 0)
}

// ---------------------------------------------------------------------------
// PPTX  (jszip + DrawingML XML)
// ---------------------------------------------------------------------------
async function parsePPTX(file) {
  const JSZip = (await import('jszip')).default
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)

  // DrawingML namespace used by all text elements in PPTX slides
  const DML_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'

  // Collect slide entries sorted numerically (slide1.xml, slide2.xml, …)
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const n = (s) => parseInt(s.match(/\d+/)[0], 10)
      return n(a) - n(b)
    })

  const lines = []
  const domParser = new DOMParser()

  for (let i = 0; i < slideNames.length; i++) {
    const xml = await zip.files[slideNames[i]].async('text')
    const doc = domParser.parseFromString(xml, 'application/xml')

    // Each <a:p> is a paragraph; collect text from its <a:t> runs
    const paragraphs = doc.getElementsByTagNameNS(DML_NS, 'p')
    const slideLines = []
    for (const p of paragraphs) {
      const runs = p.getElementsByTagNameNS(DML_NS, 't')
      const text = [...runs].map((t) => t.textContent).join('').trim()
      if (text) slideLines.push(text)
    }

    if (slideLines.length > 0) {
      if (i > 0) lines.push(`── Slide ${i + 1} ──`)
      lines.push(...slideLines)
    }
  }

  return lines.filter((l) => l.trim().length > 0)
}

// ---------------------------------------------------------------------------
// DOCX / DOC  (mammoth.js)
// ---------------------------------------------------------------------------
async function parseDOCX(file) {
  const mammoth = (await import('mammoth')).default
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------
async function parseText(file) {
  const text = await file.text()
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
async function parseHTML(file) {
  const text = await file.text()
  const parser = new DOMParser()
  const htmlDoc = parser.parseFromString(text, 'text/html')
  const body = htmlDoc.body?.innerText ?? htmlDoc.documentElement.innerText ?? ''
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}
