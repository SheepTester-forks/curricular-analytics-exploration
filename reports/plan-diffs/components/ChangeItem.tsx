import { Change, Term } from '../types'
import { Change as ChangeComponent } from './Change'

function displayTerm ([year, quarter]: Term) {
  return `Y${year} ${quarter}`
}

export type ChangeItemProps = {
  change: Change
}
export function ChangeItem ({ change }: ChangeItemProps) {
  return (
    <li className={`change-item ${change.type}`}>
      {change.type === 'changed' && change.changes.title ? (
        <ChangeComponent change={change.changes.title} />
      ) : (
        change.course
      )}
      {change.type !== 'changed' && (
        <>
          {' '}
          <span className='info'>
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
          <span className='change'>
            {change.changes.overlap[1] ? 'now' : 'no longer'}
          </span>{' '}
          overlaps GE
        </>
      )}
    </li>
  )
}
