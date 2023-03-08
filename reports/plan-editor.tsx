/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { App } from './plan-editor/components/App.tsx'
import { colleges } from './plan-editor/components/Metadata.tsx'
import { AcademicPlan } from './plan-editor/types.ts'

const plan: AcademicPlan = {
  startYear: String(new Date().getFullYear()),
  years: [
    [[], [], []],
    [[], [], []],
    [[], [], []],
    [[], [], []]
  ],
  departmentCode: '',
  majorName: '',
  majorCode: '',
  cipCode: '',
  collegeCode: 'RE',
  collegeName: '',
  degreeType: 'BS'
}
const params = new URL(window.location.href).searchParams
function fromUrl (
  key: keyof Omit<AcademicPlan, 'years'>,
  paramName: string
): void {
  const value = params.get(paramName)
  if (value !== null) {
    plan[key] = value
  }
}
fromUrl('startYear', 'year')
fromUrl('departmentCode', 'department')
fromUrl('majorName', 'major_name')
fromUrl('majorCode', 'major')
fromUrl('cipCode', 'cip')
fromUrl('collegeCode', 'college')
plan.collegeName = colleges[plan.collegeCode]
fromUrl('degreeType', 'degree')
{
  const coursesJson = params.get('courses')
  if (coursesJson !== null) {
    type CourseJson = [
      title: string,
      units: number,
      requirement: number,
      term: number
    ]
    const courses: CourseJson[] = JSON.parse(coursesJson)
    const terms = courses.reduce((cum, curr) => Math.max(cum, curr[3]), 0)
    plan.years = Array.from({ length: Math.ceil(terms / 3) }, () => [
      [],
      [],
      []
    ])
    for (const [title, units, requirement, term] of courses) {
      plan.years[Math.floor(term / 3)][term % 3].push({
        title,
        units: String(units),
        requirement: {
          major: !!(requirement & 0b1),
          college: !!(requirement & 0b10)
        },
        forCredit: true,
        id: Math.random()
      })
    }
  }
}

render(
  <App
    prereqs={
      JSON.parse(document.getElementById('prereqs')?.textContent ?? 'null') ||
      // deno-lint-ignore no-explicit-any
      (window as any)['PREREQS']
    }
    initPlan={plan}
    mode='advisor'
  />,
  document.getElementById('root')!
)
