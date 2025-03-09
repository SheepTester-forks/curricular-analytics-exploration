import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      courses={
        JSON.parse(
          document.getElementById('courses_by_major')?.textContent ?? 'null'
        ) || (window as any)['COURSES_BY_MAJOR']
      }
    />
  </StrictMode>
)
