import { forwardRef, useMemo } from 'react'
import katex from 'katex'
import { hasMath } from '../utils/mathToSpeech'

/**
 * Split a text string into alternating plain-text and math segments.
 * Recognises: $$...$$  $...$  \[...\]  \(...\)
 */
function splitMathSegments(text) {
  const segments = []
  let i = 0

  while (i < text.length) {
    // $$...$$ (display)
    if (text.startsWith('$$', i)) {
      const end = text.indexOf('$$', i + 2)
      if (end !== -1) {
        segments.push({ math: true, display: true, content: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    // \[...\] (display)
    if (text.startsWith('\\[', i)) {
      const end = text.indexOf('\\]', i + 2)
      if (end !== -1) {
        segments.push({ math: true, display: true, content: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    // \(...\) (inline)
    if (text.startsWith('\\(', i)) {
      const end = text.indexOf('\\)', i + 2)
      if (end !== -1) {
        segments.push({ math: true, display: false, content: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    // $...$ (inline, not $$)
    if (text[i] === '$' && !text.startsWith('$$', i)) {
      const end = text.indexOf('$', i + 1)
      if (end !== -1 && !text.startsWith('$$', end)) {
        segments.push({ math: true, display: false, content: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // Plain text — accumulate until next math delimiter
    let j = i + 1
    while (j < text.length) {
      if (
        text[j] === '$' ||
        text.startsWith('\\[', j) ||
        text.startsWith('\\(', j)
      ) break
      j++
    }
    const chunk = text.slice(i, j)
    if (chunk) segments.push({ math: false, content: chunk })
    i = j
  }

  return segments
}

function renderMathSegment(seg, keyPrefix) {
  try {
    const html = katex.renderToString(seg.content, {
      displayMode: seg.display,
      throwOnError: false,
      trust: false,
      strict: false,
    })
    return (
      <span
        key={keyPrefix}
        className={seg.display ? 'math-block' : 'math-inline'}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch {
    // KaTeX failed — show raw delimited form
    const delim = seg.display ? '$$' : '$'
    return (
      <span key={keyPrefix} className="math-error">
        {delim}{seg.content}{delim}
      </span>
    )
  }
}

/**
 * MathLine renders a text string, typesetting any LaTeX math regions with KaTeX.
 * Falls back to plain text for lines with no math.
 *
 * Accepts the same props as <p> plus forwarded ref.
 */
const MathLine = forwardRef(function MathLine(
  { text, className, onClick, title, children },
  ref,
) {
  const segments = useMemo(() => {
    if (!hasMath(text)) return null
    return splitMathSegments(text)
  }, [text])

  const props = { className, onClick, title, ref }

  if (!segments) {
    return <p {...props}>{text ?? children}</p>
  }

  return (
    <p {...props}>
      {segments.map((seg, i) =>
        seg.math
          ? renderMathSegment(seg, i)
          : <span key={i}>{seg.content}</span>,
      )}
    </p>
  )
})

export default MathLine
