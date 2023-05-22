/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { App } from './seats/components/App.tsx'

render(
  <App
    courses={
      JSON.parse(
        document.getElementById('courses_by_major')?.textContent ?? 'null'
      ) ||
      // deno-lint-ignore no-explicit-any
      (window as any)['COURSES_BY_MAJOR']
    }
  />,
  document.getElementById('root')!
)
