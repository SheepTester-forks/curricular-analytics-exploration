/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Change, Term } from '../types.ts'
import { Change as ChangeComponent } from './Change.tsx'

function displayTerm ([year, quarter]: Term) {
  return `Y${year} ${quarter}`
}

export type ChangeItemProps = {
  change: Change
}
export function ChangeItem ({ change }: ChangeItemProps) {
  return (
    <li class={`change-item ${change.type}`}>
      {change.type === 'changed' && change.changes.title ? (
        <ChangeComponent change={change.changes.title} />
      ) : (
        change.course
      )}
      {change.type !== 'changed' && (
        <>
          {' '}
          <span class='info'>
            ({displayTerm(change.term)} · {change.units} units)
          </span>
        </>
      )}
      {change.type === 'changed' && change.changes.units && (
        <>
          {' '}
          · <ChangeComponent change={change.changes.units} /> units
        </>
      )}
      {change.type === 'changed' && change.changes.term && (
        <>
          {' '}
          · <ChangeComponent change={change.changes.term} map={displayTerm} />
        </>
      )}
      {change.type === 'changed' && change.changes.type && (
        <>
          {' '}
          ·{' '}
          <ChangeComponent
            change={change.changes.type}
            map={type => type.toLowerCase()}
          />
          -type course
        </>
      )}
      {change.type === 'changed' && change.changes.overlap && (
        <>
          {' '}
          ·{' '}
          <span class='change'>
            {change.changes.overlap[1] ? 'now' : 'no longer'}
          </span>{' '}
          overlaps GE
        </>
      )}
    </li>
  )
}
