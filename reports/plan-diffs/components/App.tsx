import { useState } from 'react'
import { Diffs } from '../types'
import { DiffProps, Diff } from './Diff'
import { Table } from './Table'

export type AppProps = {
  diffs: Diffs
  collegeNames: string[]
  showDiff?: DiffProps
}
export function App ({ diffs, collegeNames, showDiff }: AppProps) {
  const [diff, setDiff] = useState<DiffProps | null>(null)
  return (
    <>
      {!showDiff && (
        <div className='side'>
          <Table
            diffs={diffs}
            collegeNames={collegeNames}
            selected={diff?.name}
            onSelect={setDiff}
          />
        </div>
      )}
      <div className='side diff'>
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
