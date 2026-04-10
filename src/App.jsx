import { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import FileUpload from './components/FileUpload'
import TextReader from './components/TextReader'

export default function App() {
  const [doc, setDoc] = useState(null) // { lines, fileName, file }
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app">
      {doc ? (
        <TextReader
          lines={doc.lines}
          fileName={doc.fileName}
          file={doc.file}
          onReset={() => setDoc(null)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <FileUpload
          onLoad={(lines, fileName, file) => setDoc({ lines, fileName, file })}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}
