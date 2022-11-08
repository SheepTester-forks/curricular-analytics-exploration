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

  const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
  const queryValid =
    courseCodes.includes(courseCode) && !selected.includes(courseCode)

  return (
    <div class='course-adder'>
      <ul class='added-courses'>
        {selected.map(courseCode => (
          <li key={courseCode} class='added-course'>
            {courseCode}
            <button
              class='remove-course'
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
        class='course-adder-form'
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
          class='add-course'
          type='search'
          name='course-code'
          list='courses'
          placeholder='Search for a course'
          autofocus
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
          }}
        />
        <input
          class='add-btn'
          type='submit'
          value='Add'
          disabled={!queryValid}
        />
      </form>
      <datalist id='courses'>
        {courseCodes.map(code => (
          <option value={code} key={code} />
        ))}
      </datalist>
    </div>
  )
}

function courseUnlocked (reqs: string[][], taken: string[]): boolean {
  reqs: for (const req of reqs) {
    for (const alt of req) {
      if (taken.includes(alt)) {
        continue reqs
      }
    }
    return false
  }
  return true
}

function getUnlockedCourses (prereqs: Prereqs, taken: string[]): string[] {
  const newCourses: string[] = []
  for (const [courseCode, reqs] of Object.entries(prereqs)) {
    // Skip classes that are unlocked by default
    if (reqs.length === 0) {
      continue
    }
    if (!taken.includes(courseCode) && courseUnlocked(reqs, taken)) {
      newCourses.push(courseCode)
    }
  }
  return newCourses
}

type TreeProps = {
  prereqs: Prereqs
  courses: string[]
}
function Tree ({ prereqs, courses }: TreeProps) {
  const levels = [courses]
  while (levels[levels.length - 1].length > 0) {
    levels.push(getUnlockedCourses(prereqs, levels.flat()))
  }
  return (
    <ol>
      {levels.map((level, i) => (
        <li key={i}>
          {level.map(course => (
            <span key={course}> &middot; {course}</span>
          ))}
        </li>
      ))}
    </ol>
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
      <Tree prereqs={prereqs} courses={courses} />
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
  />,
  document.getElementById('root')!
)
