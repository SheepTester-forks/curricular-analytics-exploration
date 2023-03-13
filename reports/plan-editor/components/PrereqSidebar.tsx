/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useState } from 'preact/hooks'
import { toCsv } from '../../util/csv.ts'
import { download } from '../../util/download.ts'
import { cleanCourseCode, CourseCode, Prereqs } from '../../util/Prereqs.ts'
import { toUcsdPlan, toCurrAnalyticsPlan } from '../export-plan.ts'
import { toSearchParams } from '../save-to-url.ts'
import { AcademicPlan } from '../types.ts'
import { CustomCourse } from './CustomCourse.tsx'
import { PrereqCheck } from './PrereqCheck.tsx'

const CUSTOM_COURSE_KEY = 'ei/plan-editor/custom-courses'
type CustomCourse = {
  name: string
  reqs: string[][]
}
export type PrereqSidebarProps = {
  prereqs: Prereqs
  onPrereqs: (newPrereqs: Prereqs) => void
  plan: AcademicPlan
  mode: 'student' | 'advisor'
}
export function PrereqSidebar ({
  prereqs,
  onPrereqs,
  plan,
  mode
}: PrereqSidebarProps) {
  const [assumedSatisfied, setAssumedSatisfied] = useState<CourseCode[]>([
    'MATH 4C',
    'AWP 3',
    'AWP 4B'
  ])
  const [custom, setCustom] = useState<CustomCourse[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_COURSE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [updateUrl, setUpdateUrl] = useState(false)

  const terms = plan.years.flatMap(year =>
    year.map(term =>
      term.filter(course => course.forCredit).map(course => course.title)
    )
  )

  useEffect(() => {
    onPrereqs(
      Object.fromEntries(
        custom.map(course => [
          course.name.toUpperCase(),
          course.reqs
            .map(alts =>
              alts.map(alt => alt.toUpperCase()).filter(alt => alt !== '')
            )
            .filter(alts => alts.length > 0)
        ])
      )
    )
  }, [custom])

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_COURSE_KEY, JSON.stringify(custom))
    } catch {
      // Ignore localStorage error
    }
  }, [custom])

  useEffect(() => {
    if (updateUrl) {
      window.history.replaceState({}, '', '?' + toSearchParams(plan))
    }
  }, [updateUrl, plan])

  const planFileName = `Degree Plan-${plan.collegeName}-${plan.majorCode}.csv`

  return (
    <aside class='sidebar'>
      <div class='download-btns save-btns'>
        <button
          class='download-btn'
          onClick={() => {
            download(
              new Blob([toSearchParams(plan).toString()]),
              `${plan.majorCode} ${plan.collegeName}.ucsdplan`
            )
          }}
        >
          Save <u>↓</u>
        </button>
        <button class='download-btn'>
          Load <u>↑</u>
        </button>
      </div>
      <label>
        <input
          type='checkbox'
          checked={updateUrl}
          onInput={e => setUpdateUrl(e.currentTarget.checked)}
        />{' '}
        Save plan in URL
      </label>
      <h2 class='sidebar-heading'>Prerequisites</h2>
      <ul class='course-codes'>
        {terms.flatMap((term, i) =>
          term.map((course, j) => {
            if (prereqs[course] && !assumedSatisfied.includes(course)) {
              return (
                <li key={`${i} ${j}`}>
                  <PrereqCheck
                    code={course}
                    reqs={prereqs[course]}
                    pastTerms={terms.slice(0, i).flat()}
                    assumedSatisfied={assumedSatisfied}
                  />
                </li>
              )
            } else {
              return null
            }
          })
        )}
      </ul>
      <h2 class='sidebar-heading'>Transferred credit</h2>
      {mode === 'advisor' ? (
        <p class='description'>
          For managing courses that most students are assumed to have credit
          for.
        </p>
      ) : (
        <p class='description'>
          Add courses that you already have equivalent credit for here.
        </p>
      )}
      <ul class='assumed-satisfied-list'>
        {[...assumedSatisfied, ''].map((name, i) => {
          const isNew = i === assumedSatisfied.length
          const handleChange = (value: string) =>
            setAssumedSatisfied(
              isNew
                ? [...assumedSatisfied, value]
                : assumedSatisfied.map((course, j) =>
                    j === i ? value : course
                  )
            )
          return (
            <li
              class={`assumed-satisfied ${
                isNew ? 'assumed-satisfied-new' : ''
              }`}
              key={i}
            >
              <input
                class='assumed-satisfied-input'
                type='text'
                list='courses'
                placeholder={isNew ? 'Type a course code here' : 'Course code'}
                value={name}
                onInput={e => handleChange(e.currentTarget.value)}
                onChange={e =>
                  handleChange(cleanCourseCode(e.currentTarget.value))
                }
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.currentTarget.parentElement?.nextElementSibling
                      ?.querySelector('input')
                      ?.focus()
                  } else if (e.key === 'Backspace' && name === '') {
                    if (i < assumedSatisfied.length) {
                      setAssumedSatisfied(
                        assumedSatisfied.filter((_, j) => j !== i)
                      )
                    }
                    e.currentTarget.parentElement?.previousElementSibling
                      ?.querySelector('input')
                      ?.focus()
                    e.preventDefault()
                  }
                }}
              />
            </li>
          )
        })}
      </ul>
      <h2 class='sidebar-heading'>
        Create a course
        <button
          class='create-course'
          onClick={() => setCustom([...custom, { name: '', reqs: [] }])}
        >
          +
        </button>
      </h2>
      {mode === 'advisor' ? (
        <p class='description'>
          For designing a new major. To change a course's prerequisites, create
          a course with an existing course code.
        </p>
      ) : (
        <p class='description'>
          For adding missing courses. To fix outdated or incorrect
          prerequisites, create a course with an existing course code to
          override its prerequisites.
        </p>
      )}
      <ul class='custom-courses'>
        {[...custom, { name: '', reqs: [] }].map(({ name, reqs }, i) => {
          const isNew = i === custom.length
          return (
            <CustomCourse
              name={name}
              reqs={reqs}
              onName={name =>
                setCustom(custom =>
                  isNew
                    ? [...custom, { name, reqs }]
                    : custom.map((course, j) =>
                        i === j ? { name, reqs: course.reqs } : course
                      )
                )
              }
              onReqs={reqs =>
                setCustom(custom =>
                  isNew
                    ? [...custom, { name, reqs }]
                    : custom.map((course, j) =>
                        i === j ? { name: course.name, reqs } : course
                      )
                )
              }
              onRemove={() => setCustom(custom.filter((_, j) => j !== i))}
              key={i}
              isNew={isNew}
            />
          )
        })}
      </ul>
      {mode === 'advisor' ? (
        <div class='download-wrapper'>
          <p class='download-label'>Export the plan as a CSV file for</p>
          <div class='download-btns'>
            <button
              class='download-btn'
              onClick={() => download(toCsv(toUcsdPlan(plan)), planFileName)}
            >
              plans.ucsd.edu
            </button>
            <button
              class='download-btn'
              onClick={() =>
                download(
                  toCsv(toCurrAnalyticsPlan(plan, prereqs)),
                  planFileName
                )
              }
            >
              Curricular Analytics
            </button>
          </div>
        </div>
      ) : (
        <div class='download-wrapper'>
          <div class='download-btns'>
            <button class='download-btn open-btn' disabled>
              Open in Curricular Analytics
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
