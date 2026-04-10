/**
 * Translate a single line of text using the MyMemory free API.
 * Results are cached in-memory by (sourceLang|targetLang + text) so each
 * unique phrase is only fetched once per session.
 *
 * MyMemory free tier: ~5 000 chars/day without a key.
 * Source: https://mymemory.translated.net/doc/spec.php
 */
const _cache = new Map()

export async function translateLine(text, targetLang, sourceLang = 'en') {
  const trimmed = text?.trim()
  if (!trimmed || !targetLang || targetLang === 'none') return text
  if (sourceLang === targetLang) return text

  // MyMemory caps per-request at ~500 chars; slice to be safe
  const query = trimmed.slice(0, 500)
  const key = `${sourceLang}|${targetLang}||${query}`

  if (_cache.has(key)) return _cache.get(key)

  try {
    const params = new URLSearchParams({ q: query, langpair: `${sourceLang}|${targetLang}` })
    const res = await fetch(`https://api.mymemory.translated.net/get?${params}`)
    if (!res.ok) return text
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText
      _cache.set(key, result)
      return result
    }
  } catch {
    // Network error or rate-limit — silently fall back to original text
  }
  return text
}

// ── Language list ──────────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'af', label: 'Afrikaans' },
  { code: 'ar', label: 'Arabic' },
  { code: 'bn', label: 'Bengali' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'cs', label: 'Czech' },
  { code: 'da', label: 'Danish' },
  { code: 'nl', label: 'Dutch' },
  { code: 'en', label: 'English' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'el', label: 'Greek' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'he', label: 'Hebrew' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'id', label: 'Indonesian' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ms', label: 'Malay' },
  { code: 'mr', label: 'Marathi' },
  { code: 'no', label: 'Norwegian' },
  { code: 'fa', label: 'Persian' },
  { code: 'pl', label: 'Polish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ro', label: 'Romanian' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'sv', label: 'Swedish' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'th', label: 'Thai' },
  { code: 'tr', label: 'Turkish' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ur', label: 'Urdu' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'cy', label: 'Welsh' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'zu', label: 'Zulu' },
]
