import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import { DiffProps } from './components/Diff'
import { Data } from './types'

const data: Data =
  JSON.parse(document.getElementById('diffs')?.textContent ?? 'null') ??
  (window as any)['DIFFS']
const root = document.getElementById('root')!

const params = new URL(window.location.href).searchParams
const major = params.get('major')
const college = params.get('college')
let showDiff: DiffProps | undefined
if (major && college) {
  top: for (const departments of Object.values(data.diffs)) {
    for (const majors of Object.values(departments)) {
      for (const [majorCode, colleges] of Object.entries(majors)) {
        if (majorCode.startsWith(major)) {
          showDiff = {
            name: `${majorCode} / ${college}`,
            diff: colleges[college]
          }
          break top
        }
      }
    }
  }
}
createRoot(root).render(
  <StrictMode>
    <App
      diffs={data.diffs}
      collegeNames={data.collegeNames}
      showDiff={showDiff}
    />
  </StrictMode>
)
