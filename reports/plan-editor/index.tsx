import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import { fromSearchParams } from './save-to-url'
import prereqs from '../output/prereqs.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      prereqs={prereqs}
      initPlan={fromSearchParams(new URL(window.location.href).searchParams)}
      mode='advisor'
    />
  </StrictMode>
)
