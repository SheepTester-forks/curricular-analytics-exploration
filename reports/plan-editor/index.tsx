import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import { fromSearchParams } from './save-to-url'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      prereqs={
        JSON.parse(document.getElementById('prereqs')?.textContent ?? 'null') ||
        (window as any)['PREREQS']
      }
      initPlan={fromSearchParams(new URL(window.location.href).searchParams)}
      mode='advisor'
    />
  </StrictMode>
)
