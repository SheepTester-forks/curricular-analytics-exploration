import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      prereqs={
        JSON.parse(document.getElementById('prereqs')?.textContent ?? 'null') ||
        (window as any)['PREREQS']
      }
    />
  </StrictMode>
)
