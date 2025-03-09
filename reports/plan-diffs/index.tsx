/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { App } from './components/App.tsx'
import { DiffProps } from './components/Diff.tsx'
import { Data } from './types.ts'

{
  const data: Data =
    JSON.parse(document.getElementById('diffs')?.textContent ?? 'null') ??
    // deno-lint-ignore no-explicit-any
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
  render(
    <App
      diffs={data.diffs}
      collegeNames={data.collegeNames}
      showDiff={showDiff}
    />,
    root
  )
}
