import { useState } from 'react'
import { Diffs, PlanDiffs } from '../types'
import { DiffProps } from './Diff'

const byKeyLocale = <T,>([a]: [string, T], [b]: [string, T]) =>
  a.localeCompare(b)

const getMetric = {
  maxUnitChange (diff: PlanDiffs) {
    return Math.max(
      ...diff.changes.map(year =>
        year.units ? Math.abs(year.units[1] - year.units[0]) : 0
      )
    )
  },
  maxComplexityChange (diff: PlanDiffs) {
    return Math.max(
      ...diff.changes.map(year =>
        year.complexity ? Math.abs(year.complexity[1] - year.complexity[0]) : 0
      )
    )
  },
  numUnitChanges (diff: PlanDiffs) {
    return diff.changes.filter(year => year.units).length
  }
}

export type TableProps = {
  diffs: Diffs
  collegeNames: string[]
  selected?: string
  onSelect: (diff: DiffProps) => void
}
export function Table ({
  diffs,
  collegeNames,
  selected,
  onSelect
}: TableProps) {
  const [metric, setMetric] = useState<keyof typeof getMetric>('maxUnitChange')
  let max = 0
  for (const departments of Object.values(diffs)) {
    for (const majors of Object.values(departments)) {
      for (const plans of Object.values(majors)) {
        for (const diffs of Object.values(plans)) {
          const value = getMetric[metric](diffs)
          if (value > max) {
            max = value
          }
        }
      }
    }
  }

  const rows = Object.entries(diffs)
    .sort(byKeyLocale)
    .flatMap(([school, departments]) =>
      Object.entries(departments)
        .sort(byKeyLocale)
        .flatMap(([department, majors], j) =>
          Object.entries(majors)
            .sort(byKeyLocale)
            .flatMap(([major, colleges], k) => {
              // https://stackoverflow.com/a/36665251
              const [code, ...name] = major.split(' ')
              return (
                <tr key={[school, department, major].join('\n')}>
                  {j === 0 && k === 0 && (
                    <th
                      scope='col'
                      rowSpan={Object.values(departments)
                        .map(majors => Object.keys(majors).length)
                        .reduce((a, b) => a + b, 0)}
                    >
                      {school}
                    </th>
                  )}
                  {k === 0 && (
                    <th scope='col' rowSpan={Object.keys(majors).length}>
                      {department}
                    </th>
                  )}
                  <td>
                    <abbr title={name.join(' ') || undefined}>{code}</abbr>
                  </td>
                  {collegeNames.map(college => (
                    <td
                      style={{
                        backgroundColor:
                          college in colleges
                            ? `rgba(0, 0, 255, ${
                              getMetric[metric](colleges[college]) / max
                            })`
                            : ''
                      }}
                      key={college}
                    >
                      {college in colleges && (
                        <button
                          disabled={selected === `${major} / ${college}`}
                          onClick={() =>
                            onSelect({
                              name: `${major} / ${college}`,
                              diff: colleges[college],
                              link:
                                '?' + new URLSearchParams({ major, college })
                            })
                          }
                        >
                          View
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })
        )
    )

  return (
    <>
      <table>
        <thead>
          <tr>
            <th scope='row'>School</th>
            <th scope='row'>Department</th>
            <th scope='row'>Major</th>
            {collegeNames.map(name => (
              <th scope='row' key={name}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p className='select-metric'>
        Color by{' '}
        <select
          value={metric}
          onChange={e => {
            if (
              e.currentTarget.value === 'maxUnitChange' ||
              e.currentTarget.value === 'maxComplexityChange' ||
              e.currentTarget.value === 'numUnitChanges'
            ) {
              setMetric(e.currentTarget.value)
            }
          }}
        >
          <option value='maxUnitChange'>largest unit change</option>
          <option value='maxComplexityChange'>largest complexity change</option>
          <option value='numUnitChanges'>frequency of unit changes</option>
        </select>
      </p>
    </>
  )
}
