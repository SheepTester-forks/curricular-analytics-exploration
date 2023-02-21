/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useState } from 'preact/hooks'
import { toCsv } from '../../util/csv.ts'
import { download } from '../../util/download.ts'
import { Prereqs } from '../../util/Prereqs.ts'
import { toUcsdPlan, toCurrAnalyticsPlan } from '../export-plan.ts'
import { AcademicPlan } from '../types.ts'
import { CustomCourse } from './CustomCourse.tsx'
import { assumedSatisfied, PrereqCheck } from './PrereqCheck.tsx'

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
  const [custom, setCustom] = useState<CustomCourse[]>(() =>
    JSON.parse(localStorage.getItem(CUSTOM_COURSE_KEY) || '[]')
  )

  const terms = plan.years.flatMap(year =>
    year.map(term => term.map(course => course.title))
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
    localStorage.setItem(CUSTOM_COURSE_KEY, JSON.stringify(custom))
  }, [custom])

  return (
    <aside class='sidebar'>
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
                  />
                </li>
              )
            } else {
              return null
            }
          })
        )}
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
        {[...custom, { name: '', reqs: [] }].map(({ name, reqs }, i) => (
          <CustomCourse
            name={name}
            reqs={reqs}
            onName={name =>
              setCustom(custom =>
                i === custom.length
                  ? [...custom, { name, reqs }]
                  : custom.map((course, j) =>
                      i === j ? { name, reqs: course.reqs } : course
                    )
              )
            }
            onReqs={reqs =>
              setCustom(custom =>
                i === custom.length
                  ? [...custom, { name, reqs }]
                  : custom.map((course, j) =>
                      i === j ? { name: course.name, reqs } : course
                    )
              )
            }
            key={i}
            isNew={i === custom.length}
          />
        ))}
      </ul>
      {mode === 'advisor' ? (
        <div class='download-wrapper'>
          <p class='download-label'>Download the plan as a CSV file for</p>
          <div class='download-btns'>
            <button
              class='download-btn'
              onClick={() =>
                download(toCsv(toUcsdPlan(plan)), `${plan.name}.csv`)
              }
            >
              plans.ucsd.edu
            </button>
            <button
              class='download-btn'
              onClick={() =>
                download(
                  toCsv(toCurrAnalyticsPlan(plan, prereqs)),
                  `${plan.name}.csv`
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
