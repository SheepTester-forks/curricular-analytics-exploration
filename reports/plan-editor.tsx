/** @jsxImportSource https://esm.sh/preact@10.11.2 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.11.2'
import {
  useEffect,
  useRef,
  useState
} from 'https://esm.sh/preact@10.11.2/hooks'

type Course = {
  title: string
  units: string
  requirement: {
    college: boolean
    major: boolean
  }
}
type TermPlan = Course[]
type YearPlan = TermPlan[]
type AcademicPlan = {
  startYear: number
  type: '4-year' | 'transfer'
  years: YearPlan[]
}

type CourseProps = {
  course: Course
  onCourse: (course: Course) => void
  new?: boolean
}
function Course ({ course, onCourse, new: isNew }: CourseProps) {
  return (
    <li class={`course-editor ${isNew ? 'add-course' : ''}`}>
      <input
        class='course-field course-title'
        type='text'
        value={course.title}
        onInput={e => onCourse({ ...course, title: e.currentTarget.value })}
      />
      {!isNew && (
        <input
          class='course-field course-units'
          type='text'
          value={course.units}
          onInput={e => onCourse({ ...course, units: e.currentTarget.value })}
        />
      )}
    </li>
  )
}

type TermProps = {
  name: string
  plan: TermPlan
  onPlan: (plan: TermPlan) => void
}
function Term ({ name, plan, onPlan }: TermProps) {
  return (
    <div class='term-editor'>
      <h3>{name}</h3>
      <ul class='courses'>
        {[
          ...plan,
          {
            title: '',
            units: '4',
            requirement: { college: false, major: false }
          }
        ].map((course, i) => (
          <Course
            course={course}
            onCourse={newCourse =>
              onPlan(
                i === plan.length
                  ? [...plan, newCourse]
                  : plan.map((course, index) =>
                      index === i ? newCourse : course
                    )
              )
            }
            new={i === plan.length}
            key={i}
          />
        ))}
      </ul>
    </div>
  )
}

const termNames = ['Fall', 'Winter', 'Spring']
type YearProps = {
  planStartYear: number
  index: number
  plan: YearPlan
  onPlan: (plan: YearPlan) => void
}
function Year ({ planStartYear, index, plan, onPlan }: YearProps) {
  return (
    <div class='year-editor'>
      <h2>
        Year {index + 1}: {planStartYear + index}–{planStartYear + index + 1}
      </h2>
      <div class='terms'>
        {plan.map((term, i) => (
          <Term
            name={termNames[i]}
            plan={term}
            onPlan={newPlan =>
              onPlan(plan.map((term, index) => (index === i ? newPlan : term)))
            }
            key={i}
          />
        ))}
      </div>
    </div>
  )
}

type EditorProps = {
  plan: AcademicPlan
  onPlan: (plan: AcademicPlan) => void
}
function Editor ({ plan, onPlan }: EditorProps) {
  return (
    <div class='plan-editor'>
      {plan.years.map((year, i) => (
        <Year
          planStartYear={plan.startYear}
          index={i}
          plan={year}
          onPlan={newPlan =>
            onPlan({
              ...plan,
              years: plan.years.map((year, index) =>
                index === i ? newPlan : year
              )
            })
          }
          key={i}
        />
      ))}
    </div>
  )
}

type AppProps = {
  initPlan: AcademicPlan
}
function App ({ initPlan }: AppProps) {
  const [plan, setPlan] = useState(initPlan)

  return <Editor plan={plan} onPlan={setPlan} />
}

render(
  <App
    initPlan={{
      startYear: 2021,
      type: '4-year',
      years: [
        [
          [
            {
              title: 'CSE 8A',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'MATH 20A',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'CAT 1',
              units: '4',
              requirement: { college: true, major: false }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'CSE 8B',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'MATH 20B',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 20',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CAT 2',
              units: '6',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'PHYS 2A',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'MATH 18',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 12',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 15L',
              units: '2',
              requirement: { college: false, major: true }
            },
            {
              title: 'CAT 3',
              units: '6',
              requirement: { college: true, major: false }
            }
          ]
        ],
        [
          [
            {
              title: 'ECE 35',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'PHYS 2B',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'MATH 20C',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 21',
              units: '4',
              requirement: { college: false, major: true }
            }
          ],
          [
            {
              title: 'PHYS 2C',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 30',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'MATH 20D',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'ECE 45',
              units: '4',
              requirement: { college: false, major: true }
            }
          ],
          [
            {
              title: 'ECE 65',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 100',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'ECE 109',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ]
        ],
        [
          [
            {
              title: 'CSE 110',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 101',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CAT 125',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'ECE 101',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 140L',
              units: '2',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 140',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE / DEI',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'CSE 141 (OR CSE 142)',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 141L (OR CSE 142L)',
              units: '2',
              requirement: { college: false, major: true }
            },
            {
              title: 'TECHNICAL ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'ECE 111 (OR ECE 140B)',
              units: '4',
              requirement: { college: false, major: true }
            }
          ]
        ],
        [
          [
            {
              title: 'CSE 120',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'ECE 108',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ]
        ]
      ]
    }}
  />,
  document.getElementById('root')!
)
