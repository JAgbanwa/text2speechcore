/**
 * Converts LaTeX math expressions and Unicode math symbols to natural spoken English.
 * Used by SpeechEngine before passing text to SpeechSynthesis.
 */

// ── Greek letters ────────────────────────────────────────────────────────────
const GREEK = {
  '\\alpha': 'alpha', '\\beta': 'beta', '\\gamma': 'gamma', '\\delta': 'delta',
  '\\epsilon': 'epsilon', '\\varepsilon': 'epsilon', '\\zeta': 'zeta', '\\eta': 'eta',
  '\\theta': 'theta', '\\Theta': 'Theta', '\\vartheta': 'theta',
  '\\iota': 'iota', '\\kappa': 'kappa',
  '\\lambda': 'lambda', '\\Lambda': 'Lambda',
  '\\mu': 'mu', '\\nu': 'nu', '\\xi': 'xi', '\\Xi': 'Xi',
  '\\pi': 'pi', '\\Pi': 'Pi', '\\varpi': 'pi',
  '\\rho': 'rho', '\\varrho': 'rho',
  '\\sigma': 'sigma', '\\Sigma': 'Sigma', '\\varsigma': 'sigma',
  '\\tau': 'tau', '\\upsilon': 'upsilon', '\\Upsilon': 'Upsilon',
  '\\phi': 'phi', '\\Phi': 'Phi', '\\varphi': 'phi',
  '\\chi': 'chi', '\\psi': 'psi', '\\Psi': 'Psi',
  '\\omega': 'omega', '\\Omega': 'Omega',
  '\\Gamma': 'Gamma', '\\Delta': 'Delta', '\\Alpha': 'alpha',
  '\\Beta': 'beta', '\\Eta': 'eta',
}

// ── Math operators and functions ─────────────────────────────────────────────
const OPERATORS = {
  '\\infty': 'infinity', '\\partial': 'partial', '\\nabla': 'nabla',
  '\\pm': 'plus or minus', '\\mp': 'minus or plus',
  '\\times': 'times', '\\div': 'divided by', '\\cdot': 'dot',
  '\\leq': 'less than or equal to', '\\le': 'less than or equal to',
  '\\geq': 'greater than or equal to', '\\ge': 'greater than or equal to',
  '\\neq': 'not equal to', '\\ne': 'not equal to',
  '\\approx': 'approximately equal to', '\\equiv': 'equivalent to',
  '\\propto': 'proportional to', '\\sim': 'similar to',
  '\\simeq': 'similar or equal to', '\\cong': 'congruent to',
  '\\in': 'in', '\\notin': 'not in',
  '\\subset': 'subset of', '\\subseteq': 'subset or equal to',
  '\\supset': 'superset of', '\\supseteq': 'superset or equal to',
  '\\cup': 'union', '\\cap': 'intersection',
  '\\setminus': 'set minus', '\\emptyset': 'empty set', '\\varnothing': 'empty set',
  '\\rightarrow': 'approaches', '\\to': 'to', '\\leftarrow': 'from',
  '\\Rightarrow': 'implies', '\\Leftarrow': 'implied by',
  '\\Leftrightarrow': 'if and only if', '\\leftrightarrow': 'if and only if',
  '\\forall': 'for all', '\\exists': 'there exists', '\\nexists': 'there does not exist',
  '\\neg': 'not', '\\land': 'and', '\\lor': 'or',
  '\\oplus': 'xor', '\\otimes': 'tensor product',
  '\\sin': 'sine', '\\cos': 'cosine', '\\tan': 'tangent',
  '\\arcsin': 'arcsine', '\\arccos': 'arccosine', '\\arctan': 'arctangent',
  '\\sinh': 'hyperbolic sine', '\\cosh': 'hyperbolic cosine', '\\tanh': 'hyperbolic tangent',
  '\\log': 'log', '\\ln': 'natural log', '\\exp': 'exp',
  '\\lim': 'limit', '\\limsup': 'limit superior', '\\liminf': 'limit inferior',
  '\\sup': 'supremum', '\\inf': 'infimum', '\\max': 'maximum', '\\min': 'minimum',
  '\\det': 'determinant', '\\dim': 'dimension', '\\rank': 'rank', '\\ker': 'kernel',
  '\\int': 'integral', '\\oint': 'contour integral',
  '\\iint': 'double integral', '\\iiint': 'triple integral',
  '\\sum': 'sum', '\\prod': 'product',
  '\\cdots': 'and so on', '\\ldots': 'and so on', '\\vdots': 'and so on',
  '\\ddots': 'and so on',
  '\\therefore': 'therefore', '\\because': 'because',
  '\\perp': 'perpendicular to', '\\parallel': 'parallel to',
  '\\angle': 'angle', '\\triangle': 'triangle', '\\square': 'square',
  '\\ell': 'ell',
  // Formatting/sizing — drop these
  '\\left': '', '\\right': '', '\\big': '', '\\Big': '', '\\bigg': '', '\\Bigg': '',
  '\\,': ' ', '\\;': ' ', '\\:': ' ', '\\!': '',
  '\\quad': ' ', '\\qquad': '  ',
}

// ── Unicode math symbols ──────────────────────────────────────────────────────
const UNICODE_MATH = {
  '∞': 'infinity', '∂': 'partial', '∇': 'nabla',
  '∑': 'sum', '∏': 'product',
  '∫': 'integral', '∬': 'double integral', '∭': 'triple integral',
  '±': 'plus or minus', '∓': 'minus or plus',
  '×': 'times', '÷': 'divided by', '·': ' dot ',
  '≤': 'less than or equal to', '≥': 'greater than or equal to',
  '≠': 'not equal to', '≈': 'approximately', '≡': 'equivalent to',
  '∝': 'proportional to', '∼': 'similar to',
  '∈': 'in', '∉': 'not in', '⊂': 'subset of', '⊃': 'superset of',
  '∪': 'union', '∩': 'intersection', '∅': 'empty set',
  '→': 'approaches', '←': 'from', '↔': 'if and only if',
  '⇒': 'implies', '⇐': 'implied by', '⇔': 'if and only if',
  '∀': 'for all', '∃': 'there exists', '∄': 'there does not exist',
  '¬': 'not', '∧': 'and', '∨': 'or',
  '⊕': 'xor', '⊗': 'tensor product',
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
  'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
  'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
  'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho',
  'σ': 'sigma', 'τ': 'tau', 'υ': 'upsilon', 'φ': 'phi',
  'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
  'Γ': 'Gamma', 'Δ': 'Delta', 'Θ': 'Theta', 'Λ': 'Lambda',
  'Ξ': 'Xi', 'Π': 'Pi', 'Σ': 'Sigma', 'Υ': 'Upsilon',
  'Φ': 'Phi', 'Ψ': 'Psi', 'Ω': 'Omega',
  '²': ' squared', '³': ' cubed',
  '⁰': ' to the zero', '⁴': ' to the fourth', '⁵': ' to the fifth',
  '⁻': ' negative', '⁺': ' positive',
  '₀': ' zero', '₁': ' one', '₂': ' two', '₃': ' three', '₄': ' four',
  '√': 'square root of', '∛': 'cube root of', '∜': 'fourth root of',
  '°': ' degrees', '′': ' prime', '″': ' double prime',
  '…': 'and so on',
}

/** Escape a string for use inside RegExp */
function escR(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Convert a LaTeX math expression (content between delimiters, no $ signs) to spoken English.
 */
export function latexToSpeech(latex) {
  let s = latex

  // ── Unwrap font/decoration commands — keep inner content ──────────────────
  const UNWRAP = [
    '\\hat', '\\widehat', '\\tilde', '\\widetilde', '\\bar', '\\overline',
    '\\underline', '\\dot', '\\ddot', '\\vec', '\\overrightarrow',
    '\\text', '\\textrm', '\\textbf', '\\textit',
    '\\mathrm', '\\mathbf', '\\mathit', '\\mathsf', '\\mathtt',
    '\\mathbb', '\\mathcal', '\\mathfrak', '\\boldsymbol', '\\bm',
  ]
  for (let pass = 0; pass < 3; pass++) {
    for (const cmd of UNWRAP) {
      s = s.replace(new RegExp(escR(cmd) + '\\{([^{}]*)\\}', 'g'), '$1')
    }
  }
  // Named decoration → semantic speech
  s = s.replace(/\\hat\s*([a-zA-Z])/g, '$1 hat ')
  s = s.replace(/\\vec\s*([a-zA-Z])/g, '$1 vector ')
  s = s.replace(/\\tilde\s*([a-zA-Z])/g, '$1 tilde ')
  s = s.replace(/\\bar\s*([a-zA-Z])/g, '$1 bar ')
  s = s.replace(/\\dot\s*([a-zA-Z])/g, '$1 dot ')

  // ── Fractions ──────────────────────────────────────────────────────────────
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, ' ($1) over ($2) ')
    if (next === s) break
    s = next
  }

  // ── Binomial ───────────────────────────────────────────────────────────────
  s = s.replace(/\\binom\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 choose $2 ')

  // ── Roots ─────────────────────────────────────────────────────────────────
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, ' $1-th root of $2 ')
  for (let i = 0; i < 4; i++) {
    const next = s.replace(/\\sqrt\{([^{}]+)\}/g, ' square root of $1 ')
    if (next === s) break
    s = next
  }
  s = s.replace(/\\sqrt\s+([a-zA-Z0-9])/g, 'square root of $1 ')

  // ── Integrals / sums / products with limits ───────────────────────────────
  s = s.replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, ' integral from $1 to $2 of ')
  s = s.replace(/\\int_([^\s{^])\^([^\s{])/g, ' integral from $1 to $2 of ')
  s = s.replace(/\\oint_\{([^{}]+)\}/g, ' contour integral over $1 of ')
  s = s.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, ' sum from $1 to $2 of ')
  s = s.replace(/\\sum_\{([^{}]+)\}/g, ' sum over $1 of ')
  s = s.replace(/\\prod_\{([^{}]+)\}\^\{([^{}]+)\}/g, ' product from $1 to $2 of ')
  s = s.replace(/\\lim_\{([^{}]+)\}/g, ' limit as $1 of ')
  s = s.replace(/\\lim_([^\s{])/g, ' limit as $1 of ')

  // ── Superscripts ──────────────────────────────────────────────────────────
  s = s.replace(/\^\{2\}/g, ' squared ')
  s = s.replace(/\^\{3\}/g, ' cubed ')
  s = s.replace(/\^\{-1\}/g, ' inverse ')
  s = s.replace(/\^\{T\}/g, ' transpose ')
  s = s.replace(/\^\{\\top\}/g, ' transpose ')
  for (let i = 0; i < 4; i++) {
    const next = s.replace(/\^\{([^{}]+)\}/g, ' to the power of ($1) ')
    if (next === s) break
    s = next
  }
  s = s.replace(/\^2\b/g, ' squared ')
  s = s.replace(/\^3\b/g, ' cubed ')
  s = s.replace(/\^([a-zA-Z0-9])/g, ' to the power $1 ')

  // ── Subscripts ────────────────────────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const next = s.replace(/_\{([^{}]+)\}/g, ' sub ($1) ')
    if (next === s) break
    s = next
  }
  s = s.replace(/_([a-zA-Z0-9])/g, ' sub $1 ')

  // ── Named commands (Greek + operators) ───────────────────────────────────
  const ALL_CMDS = { ...GREEK, ...OPERATORS }
  // Longest patterns first to avoid partial matches
  const sortedCmds = Object.keys(ALL_CMDS).sort((a, b) => b.length - a.length)
  for (const cmd of sortedCmds) {
    const word = ALL_CMDS[cmd]
    const re = new RegExp(escR(cmd) + '(?:\\b|(?=[^a-zA-Z]))', 'g')
    s = word === ''
      ? s.replace(new RegExp(escR(cmd) + '(?:\\{[^}]*\\})?', 'g'), ' ')
      : s.replace(re, ` ${word} `)
  }

  // ── Remove remaining \commands and LaTeX punctuation ────────────────────
  s = s.replace(/\\[a-zA-Z]+\*?/g, ' ')
  s = s.replace(/[{}_^]/g, ' ')

  // ── Replace Unicode math symbols ─────────────────────────────────────────
  for (const [sym, word] of Object.entries(UNICODE_MATH)) {
    if (s.includes(sym)) s = s.split(sym).join(` ${word} `)
  }

  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Convert a full text line (which may contain $...$, $$...$$, \(...\), \[...\],
 * or Unicode math symbols) into natural spoken text suitable for TTS.
 */
export function lineToSpeech(text) {
  if (!text) return text
  // Pass separator lines through unmodified
  if (text.startsWith('──')) return text.replace(/──/g, '').trim()

  let result = text

  // $$...$$ display math
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => ` ${latexToSpeech(math)} `)
  // $...$ inline math (not $$)
  result = result.replace(/\$([^$\n]+)\$/g, (_, math) => ` ${latexToSpeech(math)} `)
  // \[...\] display math
  result = result.replace(/\\\[([^\]]+)\\\]/g, (_, math) => ` ${latexToSpeech(math)} `)
  // \(...\) inline math
  result = result.replace(/\\\(([^)]+)\\\)/g, (_, math) => ` ${latexToSpeech(math)} `)

  // Unicode math symbols in plain text
  for (const [sym, word] of Object.entries(UNICODE_MATH)) {
    if (result.includes(sym)) result = result.split(sym).join(` ${word} `)
  }

  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Returns true if the string contains any math notation worth rendering/
 * converting.
 */
export function hasMath(text) {
  if (!text) return false
  return /\$|\\\(|\\\[|\\[a-zA-Z]|[∞∂∇∑∏∫±×÷≤≥≠≈≡∈∉⊂⊃∪∩→←↔⇒⇐⇔∀∃αβγδεζηθιλμνξπρστυφχψωΓΔΘΛΞΠΣΥΦΨΩ²³√°′]/.test(text)
}
