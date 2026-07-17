import { Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { ReturnReview } from './pages/ReturnReview'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/returns/:returnId" element={<ReturnReview />} />
    </Routes>
  )
}

export default App
