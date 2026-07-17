import { Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Tax Platform</h1>
        <p className="mt-2 text-slate-500">Scaffold ready.</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
