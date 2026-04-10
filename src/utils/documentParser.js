/**
 * Parses a File into an array of non-empty text lines.
 * Supports: PDF, DOCX/DOC, TXT, MD, HTML, CSV, and any plain-text format.
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
