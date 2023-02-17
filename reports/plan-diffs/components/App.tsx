/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { Diffs } from '../types.ts'
import { DiffProps, Diff } from './Diff.tsx'
import { Table } from './Table.tsx'

export type AppProps = {
  diffs: Diffs
  showDiff?: DiffProps
}
export function App ({ diffs, showDiff }: AppProps) {
  const [diff, setDiff] = useState<DiffProps | null>(null)
  return (
    <>
      {!showDiff && (
        <div class='side'>
          <Table diffs={diffs} selected={diff?.name} onSelect={setDiff} />
        </div>
      )}
      <div class='side diff'>
        {showDiff ? (
          <Diff {...showDiff} />
        ) : diff ? (
          <Diff {...diff} />
        ) : (
          <p>
            <em>Select a major/college to view its changes.</em>
          </p>
        )}
      </div>
    </>
  )
}
