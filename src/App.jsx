import { useState } from 'react'
import FileUpload from './components/FileUpload'
import TextReader from './components/TextReader'

export default function App() {
  const [doc, setDoc] = useState(null) // { lines: string[], fileName: string }

  return (
    <div className="app">
      {doc ? (
        <TextReader
          lines={doc.lines}
          fileName={doc.fileName}
          onReset={() => setDoc(null)}
        />
      ) : (
        <FileUpload onLoad={(lines, fileName) => setDoc({ lines, fileName })} />
      )}
    </div>
  )
}
