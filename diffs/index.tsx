/** @jsxImportSource https://esm.sh/preact@10.10.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.10.6'
import { memo, useState } from 'https://esm.sh/preact@10.10.6/compat'

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

type PlanDiffs = {
  changes: YearDiff[]
  maxUnitChange: number
  maxComplexityChange: number
  numUnitChanges: number
}
const metrics = [
  'maxUnitChange',
  'maxComplexityChange',
  'numUnitChanges'
] as const

type Diffs = {
  [school: string]: {
    [department: string]: {
      [major: string]: {
        [college: string]: PlanDiffs
      }
    }
  }
}

type Diff = { name: string; diff: YearDiff[] }

const collegeNames = [
  'Revelle',
  'Muir',
  'Marshall',
  'Warren',
  'ERC',
  'Sixth',
  'Seventh'
]

const byKeyLocale = <T,>([a]: [string, T], [b]: [string, T]) =>
  a.localeCompare(b)

type TableProps = {
  diffs: Diffs
  selected?: string
  onSelect: (diff: Diff) => void
}
function Table ({ diffs, selected, onSelect }: TableProps) {
  const maxMetrics = {
    maxUnitChange: 0,
    maxComplexityChange: 0,
    numUnitChanges: 0
  }
  for (const departments of Object.values(diffs)) {
    for (const majors of Object.values(departments)) {
      for (const plans of Object.values(majors)) {
        for (const diffs of Object.values(plans)) {
          for (const metric of metrics) {
            if (diffs[metric] > maxMetrics[metric]) {
              maxMetrics[metric] = diffs[metric]
            }
          }
        }
      }
    }
  }
  const [metric, setMetric] = useState<typeof metrics[number]>('maxUnitChange')
  return (
    <>
      <table>
        <tr>
          <th scope='row'>School</th>
          <th scope='row'>Department</th>
          <th scope='row'>Major</th>
          {collegeNames.map(name => (
            <th scope='row'>{name}</th>
          ))}
        </tr>
        {Object.entries(diffs)
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
                      <tr>
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
                          <abbr title={name.join(' ') || undefined}>
                            {code}
                          </abbr>
                        </td>
                        {collegeNames.map(college => (
                          <td
                            style={{
                              backgroundColor:
                                college in colleges
                                  ? `rgba(0, 0, 255, ${
                                      colleges[college][metric] /
                                      maxMetrics[metric]
                                    })`
                                  : null
                            }}
                          >
                            {college in colleges && (
                              <button
                                disabled={selected === `${major} / ${college}`}
                                onClick={() =>
                                  onSelect({
                                    name: `${major} / ${college}`,
                                    diff: colleges[college].changes
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
          )}
      </table>
      <p class='select-metric'>
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

type ChangeProps = {
  before: string | number
  after: string | number
}
function Change ({ before, after }: ChangeProps) {
  return (
    <span class='change'>
      {before} <span class='arrow'>→</span> {after}
    </span>
  )
}

function displayTerm (term: number) {
  return `Y${(term / 4) | 0} ${['FA', 'WI', 'SP', 'SU'][term % 4]}`
}

type DiffProps = {
  name: string
  diff: YearDiff[]
}
function Diff ({ name, diff }: DiffProps) {
  return (
    <div>
      <h1>{name}</h1>
      <p>
        <em>
          Starts in <a href={diff[0].url[0]}>{diff[0].year[0]}</a>.
        </em>
      </p>
      {diff.map(({ year: [, year], url: [, url], units, changes }) => (
        <>
          <h2>
            Changes in <a href={url}>{year}</a>
            {units[0] !== units[1] && (
              <>
                {' '}
                <span class='units'>
                  ({<Change before={units[0]} after={units[1]} />},{' '}
                  {units[1] > units[0] && '+'}
                  {units[1] - units[0]} units)
                </span>
              </>
            )}
          </h2>
          <ul class='changes'>
            {changes.length === 0 && (
              <li>
                <em>No changes.</em>
              </li>
            )}
            {changes.map(change => (
              <li class={`change-item ${change.type}`}>
                {change.type === 'changed' && change.changes.title ? (
                  <Change
                    before={change.changes.title[0]}
                    after={change.changes.title[1]}
                  />
                ) : (
                  change.course
                )}
                {change.type === 'changed' && change.changes.units && (
                  <>
                    {' '}
                    ·{' '}
                    <Change
                      before={change.changes.units[0]}
                      after={change.changes.units[1]}
                    />{' '}
                    units
                  </>
                )}
                {change.type === 'changed' && change.changes.term && (
                  <>
                    {' '}
                    ·{' '}
                    <Change
                      before={displayTerm(change.changes.term[0])}
                      after={displayTerm(change.changes.term[1])}
                    />
                  </>
                )}
                {change.type === 'changed' && change.changes.type && (
                  <>
                    {' '}
                    ·{' '}
                    <Change
                      before={change.changes.type[0].toLowerCase()}
                      after={change.changes.type[1].toLowerCase()}
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
            ))}
          </ul>
        </>
      ))}
    </div>
  )
}

type AppProps = {
  diffs: Diffs
}
function App ({ diffs }: AppProps) {
  const [diff, setDiff] = useState<Diff | null>(null)
  return (
    <>
      <div class='side'>
        <Table diffs={diffs} selected={diff?.name} onSelect={setDiff} />
      </div>
      <div class='side diff'>
        {diff ? (
          <Diff name={diff.name} diff={diff.diff} />
        ) : (
          <p>
            <em>Select a major/college to view its changes.</em>
          </p>
        )}
      </div>
    </>
  )
}

render(
  <App diffs={JSON.parse(document.getElementById('diffs')!.textContent!)} />,
  document.getElementById('root')!
)
