import { Routes, Route } from 'react-router-dom'
import { ViewSwitcher } from './components/ViewSwitcher'
import { Dashboard } from './pages/Dashboard'
import { ReturnReview } from './pages/ReturnReview'
import { ClientPortal } from './pages/ClientPortal'

function App() {
  return (
    <>
      <ViewSwitcher />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/returns/:returnId" element={<ReturnReview />} />
        <Route path="/portal" element={<ClientPortal />} />
      </Routes>
    </>
  )
}

export default App
