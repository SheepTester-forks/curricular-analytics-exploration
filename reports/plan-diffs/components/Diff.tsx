import { PlanDiffs } from '../types'
import { YearDiff } from './YearDiff'

export type DiffProps = {
  name: string
  diff: PlanDiffs
  link?: string
}
export function Diff ({ name, diff, link }: DiffProps) {
  return (
    <div>
      <h1>
        {name}
        {link && (
          <>
            {' '}
            <a href={link}>#</a>
          </>
        )}
      </h1>
      <p>
        <em>
          Starts in <a href={diff.first.url}>{diff.first.year}</a>.
        </em>
      </p>
      {diff.changes.map(change => (
        <YearDiff {...change} key={change.year} />
      ))}
    </div>
  )
}
