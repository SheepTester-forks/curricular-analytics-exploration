import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
// @ts-ignore (`make` no longer generates this file by default so I don't want
// type errors from here showing up)
import courses from '../../courses_req_by_majors.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App courses={courses} />
  </StrictMode>
)
