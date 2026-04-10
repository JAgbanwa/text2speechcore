/**
 * Parse a LaTeX .tex source file into an array of readable text lines,
 * preserving math in $...$ / $$...$$ delimiter form for KaTeX rendering.
 */

/**
 * Replace math regions with temporary placeholders so that subsequent
 * text-processing steps don't accidentally strip LaTeX inside equations.
 */
function protectMath(text) {
  const blocks = []
  const store = (m) => { const i = blocks.push(m) - 1; return `\x00M${i}\x00` }

  // Display math: \begin{equation|align|gather|multline|eqnarray}...\end{...}
  text = text.replace(
    /\\begin\{(equation|align|gather|multline|eqnarray)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_, _env, body) => store(`$$${body.trim()}$$`),
  )
  // \[...\]
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => store(`$$${body.trim()}$$`))
  // \begin{math}...\end{math}
  text = text.replace(/\\begin\{math\}([\s\S]*?)\\end\{math\}/g, (_, b) => store(`$${b.trim()}$`))
  // \(...\)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, b) => store(`$${b.trim()}$`))
  // $$ ... $$  (must come before single $)
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m) => store(m))
  // $ ... $
  text = text.replace(/\$([^$\n]+)\$/g, (m) => store(m))

  return { text, blocks }
}

function restoreMath(text, blocks) {
  return text.replace(/\x00M(\d+)\x00/g, (_, i) => blocks[i])
}

/**
 * Parse a full .tex source string into an array of display-ready lines.
 * Math regions are preserved as $...$ / $$...$$ for KaTeX rendering later.
 */
export function parseLaTeXSource(src) {
  // 1. Remove LaTeX comments (% to end of line, but not \%)
  let text = src.replace(/(^|[^\\])%[^\n]*/gm, '$1')

  // 2. Extract \begin{document}...\end{document} if present
  const bodyMatch = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)
  if (bodyMatch) text = bodyMatch[1]

  // 3. Protect math regions from text processing
  const { text: protected_, blocks } = protectMath(text)
  text = protected_

  // 4. Extract title/author before other processing
  text = text.replace(/\\title\{([^}]+)\}/g, '\n── $1 ──\n')
  text = text.replace(/\\author\{([^}]+)\}/g, '\nBy $1\n')
  text = text.replace(/\\date\{[^}]*\}/g, '')

  // 5. Section commands → visual separators
  text = text.replace(/\\(?:chapter|part)\*?\{([^}]+)\}/g, '\n── $1 ──\n')
  text = text.replace(/\\section\*?\{([^}]+)\}/g, '\n── $1 ──\n')
  text = text.replace(/\\subsection\*?\{([^}]+)\}/g, '\n─ $1 ─\n')
  text = text.replace(/\\subsubsection\*?\{([^}]+)\}/g, '\n$1\n')
  text = text.replace(/\\paragraph\*?\{([^}]+)\}/g, '\n$1\n')

  // 6. Environments
  // Abstract
  text = text.replace(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g,
    '\n── Abstract ──\n$1\n',
  )
  // Theorem-like environments — keep label + content
  const THEOREMS = 'theorem|lemma|corollary|proposition|definition|remark|example|proof|claim|conjecture'
  text = text.replace(
    new RegExp(`\\\\begin\\{(${THEOREMS})\\}(?:\\[([^\\]]+)\\])?([\\s\\S]*?)\\\\end\\{(?:${THEOREMS})\\}`, 'g'),
    (_, env, label, body) => {
      const header = label
        ? `${env[0].toUpperCase() + env.slice(1)} (${label})`
        : env[0].toUpperCase() + env.slice(1)
      return `\n${header}:\n${body.trim()}\n`
    },
  )
  // List environments
  text = text.replace(/\\begin\{(?:itemize|enumerate|description)\}/g, '\n')
  text = text.replace(/\\end\{(?:itemize|enumerate|description)\}/g, '\n')
  text = text.replace(/\\item\[([^\]]+)\]/g, '\n• $1: ')
  text = text.replace(/\\item\s*/g, '\n• ')
  // Tables and figures — drop them (they don't translate to audio well)
  text = text.replace(
    /\\begin\{(?:table|figure|tabular|array|matrix|[pbBvV]?matrix)[^}]*\}[\s\S]*?\\end\{(?:table|figure|tabular|array|matrix|[pbBvV]?matrix)[^}]*\}/g,
    '',
  )
  // algorithm / lstlisting / verbatim — keep literal content
  text = text.replace(/\\begin\{(?:verbatim|lstlisting|alltt)\}([\s\S]*?)\\end\{(?:verbatim|lstlisting|alltt)\}/g, '\n$1\n')
  // Remove all remaining unknown environments
  text = text.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, '')

  // 7. Inline font commands — unwrap (keep text, drop command)
  const UNWRAP_TEXT = [
    '\\textbf', '\\textit', '\\emph', '\\underline', '\\texttt', '\\textrm',
    '\\textsf', '\\textsc', '\\textup', '\\textsl', '\\textnormal',
    '\\textcolor\\{[^}]+\\}',
  ]
  for (const cmd of UNWRAP_TEXT) {
    for (let i = 0; i < 3; i++) {
      text = text.replace(new RegExp(`${cmd}\\{([^{}]*)\\}`, 'g'), '$1')
    }
  }

  // 8. References / citations
  text = text.replace(/\\footnote\{[^}]*\}/g, '')
  text = text.replace(/\\label\{[^}]*\}/g, '')
  text = text.replace(/\\ref\{([^}]*)\}/g, '[ref: $1]')
  text = text.replace(/\\eqref\{([^}]*)\}/g, '[equation $1]')
  text = text.replace(/\\cite(?:\[[^\]]*\])?\{([^}]*)\}/g, '[cite: $1]')
  text = text.replace(/\\url\{([^}]*)\}/g, '$1')
  text = text.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')

  // 9. Drop pure-formatting / structural commands
  const DROP = [
    'maketitle', 'tableofcontents', 'newpage', 'clearpage', 'cleardoublepage',
    'noindent', 'centering', 'raggedright', 'raggedleft',
    'vspace\\*?', 'hspace\\*?', 'vskip', 'hskip', 'vfill', 'hfill',
    'linebreak', 'pagebreak', 'newline', 'par',
    'medskip', 'bigskip', 'smallskip', 'baselineskip',
    'usepackage', 'documentclass', 'setlength', 'setcounter',
    'renewcommand', 'newcommand', 'DeclareMathOperator',
    'def', 'let', 'input', 'include', 'includeonly',
    'bibliography', 'bibliographystyle', 'appendix',
  ]
  for (const cmd of DROP) {
    text = text.replace(
      new RegExp(`\\\\${cmd}(?:\\*)?(?:\\[[^\\]]*\\])?(?:\\{[^}]*\\})*`, 'g'),
      '',
    )
  }

  // 10. Strip remaining \commands outside math (math is still placeholder-protected)
  text = text.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?/g, '')

  // 11. Typography fixes
  text = text.replace(/---/g, '—').replace(/--/g, '–')
  text = text.replace(/``|''/g, '"').replace(/`/g, '\u2018').replace(/'/g, '\u2019')
  text = text.replace(/~/g, ' ')
  text = text.replace(/\{|\}/g, '')
  text = text.replace(/\\\\/g, '\n')     // explicit line break
  text = text.replace(/\\&/g, '&')
  text = text.replace(/\\\$/g, '$')      // escaped dollar → literal

  // 12. Restore math
  text = restoreMath(text, blocks)

  // 13. Split, clean, filter
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}
