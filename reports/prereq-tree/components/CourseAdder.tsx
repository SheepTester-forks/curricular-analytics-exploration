import { useState, useRef } from 'react'
import { CourseCode } from '../../util/Prereqs'

export type CourseAdderProps = {
  courseCodes: CourseCode[]
  selected: CourseCode[]
  onSelected: (selected: CourseCode[]) => void
}
export function CourseAdder ({
  courseCodes,
  selected,
  onSelected
}: CourseAdderProps) {
  const [query, setQuery] = useState('')
  const lastCourseRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
  const queryValid =
    courseCodes.includes(courseCode) && !selected.includes(courseCode)

  return (
    <ul className='course-adder'>
      {selected.map((courseCode, i) => (
        <li key={courseCode} className='added-course'>
          {courseCode}
          <button
            className='remove-course'
            ref={i === selected.length - 1 ? lastCourseRef : null}
            onClick={() => {
              onSelected(selected.filter(code => code !== courseCode))
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace') {
                onSelected(selected.filter(code => code !== courseCode))
                inputRef.current?.focus()
                // Input loses focus immediately if deleting last non-first
                // course for some reason. Force it to focus.
                requestAnimationFrame(() => {
                  inputRef.current?.focus()
                })
              }
            }}
          >
            ×
          </button>
        </li>
      ))}
      <li>
        <form
          className='course-adder-form'
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
            className='add-course'
            type='search'
            name='course-code'
            list='courses'
            placeholder='Search for a course'
            autoFocus
            value={query}
            ref={inputRef}
            onInput={e => {
              setQuery(e.currentTarget.value)
            }}
            onKeyDown={e => {
              if (e.currentTarget.value === '' && e.key === 'Backspace') {
                lastCourseRef.current?.focus()
              }
            }}
          />
          <input
            className='add-btn'
            type='submit'
            value='Add'
            disabled={!queryValid}
          />
        </form>
        <datalist id='courses'>
          {courseCodes.map(code =>
            selected.includes(code) ? null : <option value={code} key={code} />
          )}
        </datalist>
      </li>
    </ul>
  )
}
