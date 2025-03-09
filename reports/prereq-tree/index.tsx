import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import prereqs from '../output/prereqs.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App prereqs={prereqs} />
  </StrictMode>
)
