/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useState } from 'preact/hooks'
import { Prereqs } from '../../util/Prereqs.ts'
import { AcademicPlan } from '../types.ts'
import { Editor } from './Editor.tsx'
import { Metadata } from './Metadata.tsx'
import { PrereqSidebar } from './PrereqSidebar.tsx'

export type CourseJson = [
  title: string,
  units: number,
  requirement: number,
  term: number,
  forCredit?: number
]

export type AppProps = {
  prereqs: Prereqs
  initPlan: AcademicPlan
  mode: 'student' | 'advisor'
  updateUrl?: boolean
}
export function App ({
  prereqs: initPrereqs,
  initPlan,
  mode,
  updateUrl
}: AppProps) {
  const [plan, setPlan] = useState(initPlan)
  const [customPrereqs, setCustomPrereqs] = useState<Prereqs>({})

  useEffect(() => {
    if (updateUrl) {
      window.history.replaceState(
        {},
        '',
        '?' +
          new URLSearchParams({
            year: plan.startYear,
            department: plan.departmentCode,
            major_name: plan.majorName,
            major: plan.majorCode,
            cip: plan.cipCode,
            college: plan.collegeCode,
            degree: plan.degreeType,
            courses: JSON.stringify(
              plan.years.flatMap((year, i) =>
                year.flatMap((term, j) =>
                  term.map(
                    (course): CourseJson => [
                      course.title,
                      +course.units,
                      (+course.requirement.college << 1) |
                        +course.requirement.major,
                      i * 3 + j,
                      +course.forCredit
                    ]
                  )
                )
              )
            )
          })
      )
    }
  }, [updateUrl, plan])

  const prereqs = { ...initPrereqs, ...customPrereqs }

  return (
    <>
      <main class='main'>
        <div class='plan-info'>
          <Metadata
            plan={plan}
            onPlan={change => setPlan(plan => ({ ...plan, ...change }))}
          />
          <span class='total-units plan-units'>
            Total units:{' '}
            <span class='units'>
              {plan.years.reduce(
                (cum, curr) =>
                  cum +
                  curr.reduce(
                    (cum, curr) =>
                      cum + curr.reduce((cum, curr) => cum + +curr.units, 0),
                    0
                  ),
                0
              )}
            </span>
          </span>
        </div>
        <Editor prereqs={prereqs} plan={plan} onPlan={setPlan} />
      </main>
      <PrereqSidebar
        prereqs={prereqs}
        onPrereqs={setCustomPrereqs}
        plan={plan}
        mode={mode}
      />
      <datalist id='courses'>
        {Object.keys(prereqs).map(code => (
          <option value={code} key={code} />
        ))}
      </datalist>
    </>
  )
}
