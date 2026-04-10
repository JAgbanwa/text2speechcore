import { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import FileUpload from './components/FileUpload'
import TextReader from './components/TextReader'

export default function App() {
  const [doc, setDoc] = useState(null) // { lines: string[], fileName: string }
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app">
      {doc ? (
        <TextReader
          lines={doc.lines}
          fileName={doc.fileName}
          onReset={() => setDoc(null)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <FileUpload
          onLoad={(lines, fileName) => setDoc({ lines, fileName })}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}
