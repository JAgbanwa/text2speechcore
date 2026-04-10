# Text2Speech Core

A web app that accepts a document of any format and reads its text aloud to you — line by line — at the tap of a button.

## Features

- **Universal document support** — PDF, DOCX, DOC, TXT, Markdown, HTML, CSV, and more
- **Line-by-line playback** — each line is highlighted and auto-scrolled into view as it is spoken
- **Live translation** — translate each line into any of 40+ languages as it is read aloud; the translated text is displayed in the list (with the original below it) and spoken in the target language; the TTS voice automatically switches to match the chosen language; powered by the free [MyMemory API](https://mymemory.translated.net)
- **Full transport controls** — Play, Pause, Stop, Previous line, Next line
- **Seek anywhere** — click any line in the list to jump directly to it, or drag the progress scrubber
- **Speed control** — playback rate from 0.5× to 2×
- **Voice selector** — choose from all voices installed on your device
- **Focus mode** — hides the list and shows only the active line large and centred on screen (translation and original both shown)
- **Light & dark mode** — toggle between themes at any time; preference is saved to `localStorage` and the initial value follows your OS setting
- **Drag-and-drop upload** — drop a file onto the upload zone or use the file picker

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + Vite 5 |
| PDF parsing | [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) |
| DOCX parsing | [Mammoth.js](https://github.com/mwilliamson/mammoth.js) |
| Speech | Web Speech API (`SpeechSynthesis`) |
| Styling | Plain CSS (custom properties, no framework) |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server  (http://localhost:5173)
npm run dev

# Production build → dist/
npm run build
```

## Project Structure

```
src/
├── App.jsx                      # Root — switches between upload and reader views
├── index.css                    # Global styles and design tokens (dark + light themes)
├── main.jsx
├── components/
│   ├── FileUpload.jsx           # Drag-and-drop upload screen
│   ├── TextReader.jsx           # Line list, transport bar, translation controls, focus mode
│   └── ThemeToggle.jsx          # Sun / moon icon button
├── hooks/
│   └── useTheme.js              # Reads OS preference, persists choice to localStorage
└── utils/
    ├── documentParser.js        # Extracts text lines from any supported format
    ├── SpeechEngine.js          # Web Speech API wrapper with async getLineText hook
    └── translateText.js         # MyMemory API wrapper + 40+ language list
```

## Browser Support

Requires a browser with the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (`SpeechSynthesis`). Fully supported in Chrome, Edge, and Safari. Firefox support varies by platform.
