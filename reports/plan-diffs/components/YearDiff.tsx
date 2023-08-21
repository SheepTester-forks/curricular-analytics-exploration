/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Change, YearDiff } from '../types.ts'
import { Change as ChangeComponent } from './Change.tsx'
import { ChangeItem } from './ChangeItem.tsx'

const isMajorChange = (change: Change) =>
  change.type !== 'changed' || change.changes.units !== undefined

export function YearDiff ({ year, url, units, complexity, changes }: YearDiff) {
  const majorChanges = changes.filter(isMajorChange)
  const minorChanges = changes.filter(change => !isMajorChange(change))
  return (
    <>
      <h2>
        Changes in {url ? <a href={url}>{year}</a> : year}
        {(units || complexity) && (
          <>
            {' '}
            <span class={`units ${units ? '' : 'complexity'}`}>
              (
              {units && (
                <>
                  {<ChangeComponent change={units} />},{' '}
                  {units[1] > units[0] && '+'}
                  {units[1] - units[0]} units
                </>
              )}
              {units && complexity && '; '}
              {complexity && (
                <span class='complexity'>
                  {<ChangeComponent change={complexity} />},{' '}
                  {complexity[1] > complexity[0] && '+'}
                  {complexity[1] - complexity[0]} complexity
                </span>
              )}
              )
            </span>
          </>
        )}
      </h2>
      {changes.length === 0 && (
        <p class='changes'>
          <em>No changes.</em>
        </p>
      )}
      {majorChanges.length > 0 && (
        <ul class='changes'>
          {majorChanges.map(change => (
            <ChangeItem change={change} />
          ))}
        </ul>
      )}
      {minorChanges.length > 0 && (
        <details>
          <summary>View smaller changes</summary>
          <ul class='changes'>
            {minorChanges.map(change => (
              <ChangeItem change={change} />
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
