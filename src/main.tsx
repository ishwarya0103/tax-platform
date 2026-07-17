import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from './design-system'
import { CurrentUserProvider } from './context/CurrentUserContext'
import { ReturnsDataProvider } from './context/ReturnsDataContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <ReturnsDataProvider>
          <CurrentUserProvider>
            <App />
          </CurrentUserProvider>
        </ReturnsDataProvider>
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
)
