/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { App } from './prereq-tree/components/App.tsx'

render(
  <App
    prereqs={
      JSON.parse(document.getElementById('prereqs')?.textContent ?? 'false') ||
      // deno-lint-ignore no-explicit-any
      (window as any)['PREREQS']
    }
  />,
  document.getElementById('root')!
)
