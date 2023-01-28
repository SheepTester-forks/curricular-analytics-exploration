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

type CourseCode = string
type Prereqs = Record<CourseCode, CourseCode[][]>

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
        list='courses'
        value={course.title}
        onInput={e => onCourse({ ...course, title: e.currentTarget.value })}
        placeholder={isNew ? 'Add a course' : 'Course name'}
      />
      {!isNew && (
        <input
          class='course-field course-units'
          type='text'
          value={course.units}
          onInput={e => onCourse({ ...course, units: e.currentTarget.value })}
          onChange={e =>
            onCourse({
              ...course,
              units: Number.isFinite(+e.currentTarget.value)
                ? +e.currentTarget.value < 0
                  ? '0'
                  : `${+e.currentTarget.value}`
                : '4'
            })
          }
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
    <section class='term-editor'>
      <h3 class='heading term-heading'>
        {name}{' '}
        <span class='total-units'>
          Units:{' '}
          <span class='units'>
            {plan.reduce((cum, curr) => cum + +curr.units, 0)}
          </span>
        </span>
      </h3>
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
    </section>
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
    <section class='year-editor'>
      <h2 class='heading year-heading'>
        Year {index + 1}: {planStartYear + index}–{planStartYear + index + 1}{' '}
        <span class='total-units'>
          Annual units:{' '}
          <span class='units'>
            {plan.reduce(
              (cum, curr) =>
                cum + curr.reduce((cum, curr) => cum + +curr.units, 0),
              0
            )}
          </span>
        </span>
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
    </section>
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
  prereqs: Prereqs
  initPlan: AcademicPlan
}
function App ({ prereqs, initPlan }: AppProps) {
  const [plan, setPlan] = useState(initPlan)

  return (
    <>
      <Editor plan={plan} onPlan={setPlan} />
      <datalist id='courses'>
        {Object.keys(prereqs).map(code => (
          <option value={code} key={code} />
        ))}
      </datalist>
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
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
