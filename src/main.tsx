import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getBranding } from './config/branding'

// Dynamic per-tenant document title (INGEFIX build keeps "INGEFIX CRM")
document.title = getBranding().name

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
