/** @jsxImportSource https://esm.sh/preact@10.11.2 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.11.2'
import { useState } from 'https://esm.sh/preact@10.11.2/hooks'

type Prereqs = Record<string, string[][]>

type CourseAdderProps = {
  courseCodes: string[]
  selected: string[]
  onSelected: (selected: string[]) => void
}
function CourseAdder ({ courseCodes, selected, onSelected }: CourseAdderProps) {
  const [query, setQuery] = useState('')

  return (
    <>
      <ul>
        {selected.map(courseCode => (
          <li key={courseCode}>
            {courseCode}
            <button
              onClick={() => {
                onSelected(selected.filter(code => code !== courseCode))
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={e => {
          const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
          if (courseCodes.includes(courseCode)) {
            if (!selected.includes(courseCode)) {
              onSelected([...selected, courseCode])
            }
            setQuery('')
          }
          e.preventDefault()
        }}
      >
        <input
          type='search'
          name='course-code'
          list='courses'
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
          }}
        />
      </form>
      <datalist id='courses'>
        {courseCodes.map(code => (
          <option value={code} key={code} />
        ))}
      </datalist>
    </>
  )
}

type AppProps = {
  prereqs: Prereqs
}
function App ({ prereqs }: AppProps) {
  const [courses, setCourses] = useState<string[]>([])

  return (
    <>
      <CourseAdder
        courseCodes={Object.keys(prereqs)}
        selected={courses}
        onSelected={setCourses}
      />
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
  />,
  document.getElementById('root')!
)
