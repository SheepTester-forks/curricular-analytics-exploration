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

type Diffs = {
  [school: string]: {
    [department: string]: {
      [major: string]: {
        [college: string]: YearDiff[]
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

const byLocale = (a: string, b: string) => a.localeCompare(b)

type TableProps = {
  diffs: Diffs
  onSelect: (diff: Diff) => void
}
const Table = memo(({ diffs, onSelect }: TableProps) => {
  return (
    <table>
      <tr>
        <th scope='row'>School</th>
        <th scope='row'>Department</th>
        <th scope='row'>Major</th>
        {collegeNames.map(name => (
          <th scope='row'>{name}</th>
        ))}
      </tr>
      {Object.entries(diffs).flatMap(([school, departments]) =>
        Object.entries(departments).flatMap(([department, majors], j) =>
          Object.entries(majors).flatMap(([major, colleges], k) => {
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
                  <abbr title={name.join(' ') || undefined}>{code}</abbr>
                </td>
                {collegeNames.map(college => (
                  <td>
                    {college in colleges && (
                      <button
                        onClick={() =>
                          onSelect({
                            name: `${major} / ${college}`,
                            diff: colleges[college]
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
  )
})

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
      {diff.map(({ year: [, year], url: [, url] }) => (
        <>
          <h2>
            Changes in <a href={url}>{year}</a>
          </h2>
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
        <Table diffs={diffs} onSelect={setDiff} />
      </div>
      <div class='side diff'>
        {diff && <Diff name={diff.name} diff={diff.diff} />}
      </div>
    </>
  )
}

render(
  <App diffs={JSON.parse(document.getElementById('diffs')!.textContent!)} />,
  document.getElementById('root')!
)
