/** @jsxImportSource https://esm.sh/preact@10.10.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.10.6'

type BeforeAfter<T> = [T, T]

type Change =
  | {
      type: 'removed' | 'added'
      course: string
    }
  | {
      type: 'changed'
      course: string
      changes: {
        title?: BeforeAfter<string>
        units?: BeforeAfter<number>
        term?: BeforeAfter<number>
        type?: BeforeAfter<'COLLEGE' | 'DEPARTMENT'>
        overlap?: BeforeAfter<boolean>
      }
    }

type YearDiff = {
  changes: Change[]
  units: BeforeAfter<number>
  year: BeforeAfter<number>
  url: BeforeAfter<string>
}

type Diffs = {
  [department: string]: {
    [major: string]: {
      [college: string]: YearDiff[]
    }
  }
}

const colleges = [
  'Revelle',
  'Muir',
  'Marshall',
  'Warren',
  'ERC',
  'Sixth',
  'Seventh'
]

const diffs: Diffs = JSON.parse(document.getElementById('diffs')!.textContent!)

const byLocale = (a: string, b: string) => a.localeCompare(b)

function App () {
  return <>{Object.keys(diffs).join(', ')}</>
}

render(<App />, document.getElementById('root')!)
