/**
 * SpeechEngine wraps the Web Speech API (SpeechSynthesis) and provides
 * line-by-line playback control over an array of text lines.
 *
 * Usage:
 *   const engine = new SpeechEngine()
 *   engine.load(lines)
 *   engine.onLineChange = (index) => setState(index)
 *   engine.onStateChange = (playing) => setPlaying(playing)
 *   engine.play()
 */
export class SpeechEngine {
  constructor() {
    this.lines = []
    this.currentIndex = -1
    this.isPlaying = false
    this.rate = 0.95
    this.pitch = 1
    this.voice = null
    this._currentSpeakId = 0 // guards against stale async translation callbacks

    // Callbacks – set these after construction
    this.onLineChange = null   // (index: number) => void
    this.onStateChange = null  // (isPlaying: boolean) => void
    this.onFinish = null       // () => void

    // Optional async hook – set by TextReader when translation is active
    // signature: (index: number, rawText: string) => Promise<string>
    this.getLineText = null
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  load(lines) {
    window.speechSynthesis.cancel()
    this.lines = lines
    this.currentIndex = -1
    this.isPlaying = false
  }

  play(fromIndex) {
    const start =
      fromIndex !== undefined
        ? fromIndex
        : this.currentIndex >= 0
        ? this.currentIndex
        : 0

    this.isPlaying = true
    this._notifyState()
    this._speak(start)
  }

  pause() {
    this.isPlaying = false
    window.speechSynthesis.cancel()
    this._notifyState()
  }

  stop() {
    this.isPlaying = false
    window.speechSynthesis.cancel()
    this.currentIndex = -1
    if (this.onLineChange) this.onLineChange(-1)
    this._notifyState()
  }

  next() {
    const next = this.currentIndex + 1
    if (next >= this.lines.length) return
    window.speechSynthesis.cancel()
    if (this.isPlaying) {
      this._speak(next)
    } else {
      this.currentIndex = next
      if (this.onLineChange) this.onLineChange(next)
    }
  }

  prev() {
    const prev = Math.max(0, this.currentIndex - 1)
    window.speechSynthesis.cancel()
    if (this.isPlaying) {
      this._speak(prev)
    } else {
      this.currentIndex = prev
      if (this.onLineChange) this.onLineChange(prev)
    }
  }

  seekTo(index) {
    window.speechSynthesis.cancel()
    this.currentIndex = index
    if (this.onLineChange) this.onLineChange(index)
    if (this.isPlaying) this._speak(index)
  }

  setRate(rate) {
    this.rate = rate
  }

  setPitch(pitch) {
    this.pitch = pitch
  }

  setVoice(voice) {
    this.voice = voice
  }

  destroy() {
    window.speechSynthesis.cancel()
    this.onLineChange = null
    this.onStateChange = null
    this.onFinish = null
  }

  // ------------------------------------------------------------------
  // Private
  // ------------------------------------------------------------------

  /**
   * Split text into sentence-level chunks so the TTS engine can apply
   * natural intonation to each sentence rather than a flat monotone over
   * a long paragraph.  Chunks are kept ≤ 220 chars so no engine hits its
   * internal length limit.
   */
  _splitIntoChunks(text) {
    // Split after sentence-ending punctuation followed by whitespace or end-of-string
    const parts = text.split(/(?<=[.!?…])\s+/)
    const chunks = []
    let current = ''
    for (const part of parts) {
      const p = part.trim()
      if (!p) continue
      if (current.length === 0) {
        current = p
      } else if (current.length + 1 + p.length <= 220) {
        current += ' ' + p
      } else {
        chunks.push(current)
        current = p
      }
    }
    if (current) chunks.push(current)
    return chunks.length > 0 ? chunks : [text]
  }

  /**
   * Speak an ordered list of text chunks sequentially.
   * Resolves when all chunks are done or playback is interrupted.
   */
  _speakChunks(chunks, speakId) {
    return new Promise((resolve) => {
      const next = (i) => {
        if (i >= chunks.length || speakId !== this._currentSpeakId || !this.isPlaying) {
          resolve()
          return
        }
        const utt = new SpeechSynthesisUtterance(chunks[i])
        utt.rate  = this.rate
        utt.pitch = this.pitch
        if (this.voice) utt.voice = this.voice
        utt.onend = () => next(i + 1)
        utt.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') {
            resolve() // user interrupted — stop the chain cleanly
          } else {
            console.error('SpeechSynthesisUtterance error:', e.error)
            next(i + 1) // non-fatal — skip this chunk
          }
        }
        window.speechSynthesis.speak(utt)
      }
      next(0)
    })
  }

  async _speak(index) {
    const speakId = ++this._currentSpeakId

    // Skip blank lines silently but still advance the visual cursor
    if (index < this.lines.length && !this.lines[index]?.trim()) {
      this.currentIndex = index
      if (this.onLineChange) this.onLineChange(index)
      this._speak(index + 1)
      return
    }

    if (index >= this.lines.length) {
      this.isPlaying = false
      this.currentIndex = this.lines.length - 1
      this._notifyState()
      if (this.onFinish) this.onFinish()
      return
    }

    this.currentIndex = index
    if (this.onLineChange) this.onLineChange(index)

    // Resolve text — possibly translated (async)
    const rawText = this.lines[index]
    const text = this.getLineText ? await this.getLineText(index, rawText) : rawText

    // Bail out if the user paused/stopped/seeked during the async translation fetch
    if (speakId !== this._currentSpeakId || !this.isPlaying) return

    // Speak sentence-by-sentence for natural intonation
    const chunks = this._splitIntoChunks(text)
    await this._speakChunks(chunks, speakId)

    if (this.isPlaying && speakId === this._currentSpeakId) this._speak(index + 1)
  }

  _notifyState() {
    if (this.onStateChange) this.onStateChange(this.isPlaying)
  }
}
