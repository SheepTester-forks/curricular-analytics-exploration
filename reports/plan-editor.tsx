/** @jsxImportSource https://esm.sh/preact@10.11.2 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { createContext, Fragment, render } from 'https://esm.sh/preact@10.11.2'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'https://esm.sh/preact@10.11.2/hooks'
import type { JSX } from 'https://esm.sh/preact@10.11.2/jsx-runtime'

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
  startYear: string
  type: '4-year' | 'transfer'
  years: YearPlan[]
  name: string
}

type DropLocation = {
  yearIndex: number
  termIndex: number
  courseIndex: number
}
type DragState = {
  course: Course
  originalPlan: AcademicPlan
  pointerId: number
  width: number
  offsetX: number
  offsetY: number
  pointerX: number
  pointerY: number
  dropLocation: DropLocation | 'remove' | null
}
const DragContext = createContext<DragState | null>(null)

// 1. move non-down drag events out to Editor (pass props by spread)
// 2. for all the terms, useEffect get their rects, determine whether CURSOR
//    (can change to box center later) is inside term box, then figure out
//    position from hardcoded height values
// 3. Course accepts a dragged prop that sets its position and dragged class
// 4. term will insert a placeholder with a keyed Fragment

type CourseProps = {
  course: Course
  onCourse?: (course: Course) => void
  new?: boolean
  dragged?: {
    width: number
    x: number
    y: number
  }
  onDrag?: (event: JSX.TargetedPointerEvent<HTMLElement>) => void
}
function Course ({
  course,
  onCourse,
  new: isNew,
  dragged,
  onDrag
}: CourseProps) {
  return (
    <li
      class={`course-editor ${isNew ? 'add-course' : ''} ${
        dragged ? 'dragged' : ''
      }`}
      style={
        dragged
          ? {
              left: `${dragged.x}px`,
              top: `${dragged.y}px`,
              width: `${dragged.width}px`
            }
          : {}
      }
    >
      <input
        class='course-field course-title'
        type='text'
        list='courses'
        value={course.title}
        onInput={e => onCourse?.({ ...course, title: e.currentTarget.value })}
        placeholder={isNew ? 'Add a course' : 'Course name'}
        disabled={!onCourse}
      />
      {!isNew && (
        <input
          class='course-field course-units term-units'
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          value={course.units}
          onInput={e => onCourse?.({ ...course, units: e.currentTarget.value })}
          onChange={e =>
            onCourse?.({
              ...course,
              units: Number.isFinite(+e.currentTarget.value)
                ? +e.currentTarget.value < 0
                  ? '0'
                  : String(+e.currentTarget.value)
                : '4'
            })
          }
          disabled={!onCourse}
        />
      )}
      {!isNew && (
        <span
          class='term-icon-btn drag-btn'
          title='Move course'
          onPointerDown={onDrag}
        >
          ⠿
        </span>
      )}
    </li>
  )
}

const Placeholder = () => <li class='placeholder-course'></li>

const COURSE_HEIGHT = 30
const emptyCourse = {
  title: '',
  units: '4',
  requirement: { college: false, major: false }
}
type TermProps = {
  name: string
  plan: TermPlan
  onPlan: (plan: TermPlan) => void
  onDrag?: (
    event: JSX.TargetedPointerEvent<HTMLElement>,
    course: number
  ) => void
  onDropLocation?: (index: number | null) => void
}
function Term ({ name, plan, onPlan, onDrag, onDropLocation }: TermProps) {
  const dragState = useContext(DragContext)
  const element = useRef<HTMLElement>(null)
  const placeholderIndex = useMemo(() => {
    let index: number | null = null
    if (element.current && dragState) {
      const rect = element.current.getBoundingClientRect()
      if (
        dragState.pointerX >= rect.left &&
        dragState.pointerY >= rect.top &&
        dragState.pointerX < rect.right &&
        dragState.pointerY < rect.bottom
      ) {
        index = Math.floor((dragState.pointerY - rect.top) / COURSE_HEIGHT) - 1
        if (index < 0) {
          index = 0
        }
        if (index > plan.length) {
          index = plan.length
        }
      }
    }
    onDropLocation?.(index)
    return index
  }, [element.current, dragState?.pointerX, dragState?.pointerY])

  const termUnits = plan.reduce((cum, curr) => cum + +curr.units, 0)

  return (
    <section class='term-editor' ref={element}>
      <h3
        class={`heading term-heading ${
          termUnits < 12
            ? 'term-units-error'
            : termUnits > 18
            ? 'term-units-warning'
            : ''
        }`}
      >
        {name}{' '}
        <span class='total-units term-units'>
          Units:{' '}
          <span
            class={
              termUnits < 12 || termUnits > 18 ? 'units units-bad' : 'units'
            }
          >
            {termUnits}
          </span>
        </span>
        <button
          class='term-icon-btn add-course-btn'
          title='Add course'
          onClick={() => onPlan([...plan, emptyCourse])}
        >
          +
        </button>
      </h3>
      <ul class='courses'>
        {[...plan, emptyCourse].map((course, i) => (
          <Fragment key={i}>
            {dragState?.dropLocation !== 'remove' && i === placeholderIndex && (
              <Placeholder />
            )}
            {!(placeholderIndex !== null && i === plan.length) && (
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
                onDrag={e => onDrag?.(e, i)}
              />
            )}
          </Fragment>
        ))}
      </ul>
    </section>
  )
}

const termNames = ['Fall', 'Winter', 'Spring']
type YearProps = {
  planStartYear: string
  index: number
  plan: YearPlan
  onPlan: (plan: YearPlan) => void
  onYear?: ((year: string) => void) | null
  onDrag?: (
    event: JSX.TargetedPointerEvent<HTMLElement>,
    term: number,
    course: number
  ) => void
  onDropLocation?: (term: number, index: number | null) => void
}
function Year ({
  planStartYear,
  index,
  plan,
  onPlan,
  onYear,
  onDrag,
  onDropLocation
}: YearProps) {
  return (
    <section class='year-editor'>
      <h2 class='heading year-heading'>
        <strong>Year {index + 1}</strong>:{' '}
        {/* TODO: Move the start year input elsewhere. It's kind of unintuitive where it is now */}
        {onYear ? (
          <input
            class='start-year'
            type='text'
            inputMode='numeric'
            pattern='[0-9]*'
            aria-label='Starting year'
            value={planStartYear}
            onInput={e => {
              onYear(e.currentTarget.value)
            }}
            onChange={e => {
              onYear(
                Number.isFinite(+e.currentTarget.value)
                  ? String(Math.trunc(+e.currentTarget.value))
                  : String(new Date().getFullYear())
              )
            }}
          />
        ) : (
          +planStartYear + index
        )}
        –{+planStartYear + index + 1}{' '}
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
            onDrag={(e, course) => onDrag?.(e, i, course)}
            onDropLocation={index => onDropLocation?.(i, index)}
            key={i}
          />
        ))}
      </div>
    </section>
  )
}

type RemoveZoneProps = {
  onDropLocation?: (inside: boolean) => void
}
function RemoveZone ({ onDropLocation }: RemoveZoneProps) {
  const dragState = useContext(DragContext)
  const element = useRef<HTMLDivElement>(null)
  const inside = useMemo(() => {
    if (element.current && dragState) {
      const rect = element.current.getBoundingClientRect()
      onDropLocation?.(
        dragState.pointerX >= rect.left &&
          dragState.pointerY >= rect.top &&
          dragState.pointerX < rect.right &&
          dragState.pointerY < rect.bottom
      )
      return (
        dragState.pointerX >= rect.left &&
        dragState.pointerY >= rect.top &&
        dragState.pointerX < rect.right &&
        dragState.pointerY < rect.bottom
      )
    } else {
      onDropLocation?.(false)
      return false
    }
  }, [element.current, dragState?.pointerX, dragState?.pointerY])

  return (
    <div class={`remove-zone ${inside ? 'remove-hover' : ''}`} ref={element}>
      <span>Remove course</span>
    </div>
  )
}

type EditorProps = {
  plan: AcademicPlan
  onPlan: (plan: AcademicPlan) => void
}
function Editor ({ plan, onPlan }: EditorProps) {
  const element = useRef<HTMLDivElement>(null)
  // Ref needed for event handlers
  const dragStateRef = useRef<DragState | null>(null)
  // State needed to rerender
  const [dragStateVal, setDragStateVal] = useState<DragState | null>(null)

  const onPointerEnd = (e: JSX.TargetedPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current
    if (e.pointerId === dragState?.pointerId) {
      const dropLoc = dragState.dropLocation
      if (dropLoc !== 'remove') {
        onPlan(
          dropLoc
            ? {
                ...plan,
                years: plan.years.map((year, i) =>
                  i === dropLoc.yearIndex
                    ? year.map((term, j) =>
                        j === dropLoc.termIndex
                          ? [
                              ...term.slice(0, dropLoc.courseIndex),
                              dragState.course,
                              ...term.slice(dropLoc.courseIndex)
                            ]
                          : term
                      )
                    : year
                )
              }
            : dragState.originalPlan
        )
      }
      dragStateRef.current = null
      setDragStateVal(null)
    }
  }

  return (
    <div
      class='plan-editor'
      onPointerMove={e => {
        if (e.pointerId === dragStateRef.current?.pointerId) {
          dragStateRef.current = {
            ...dragStateRef.current,
            pointerX: e.clientX,
            pointerY: e.clientY
          }
          setDragStateVal(dragStateRef.current)
        }
      }}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      ref={element}
    >
      <DragContext.Provider value={dragStateVal}>
        {plan.years.map((year, yearIndex) => (
          <Year
            planStartYear={plan.startYear}
            index={yearIndex}
            plan={year}
            onPlan={newPlan =>
              onPlan({
                ...plan,
                years: plan.years.map((year, index) =>
                  index === yearIndex ? newPlan : year
                )
              })
            }
            onYear={
              yearIndex === 0
                ? startYear => onPlan({ ...plan, startYear })
                : null
            }
            onDrag={(e, termIndex, courseIndex) => {
              if (!dragStateRef.current) {
                element.current?.setPointerCapture(e.pointerId)
                const rect =
                  e.currentTarget.parentElement!.getBoundingClientRect()
                dragStateRef.current = {
                  course: plan.years[yearIndex][termIndex][courseIndex],
                  originalPlan: plan,
                  pointerId: e.pointerId,
                  width: rect.width,
                  offsetX: e.clientX - rect.left,
                  offsetY: e.clientY - rect.top,
                  pointerX: e.clientX,
                  pointerY: e.clientY,
                  dropLocation: null
                }
                setDragStateVal(dragStateRef.current)
                // Remove course
                onPlan({
                  ...plan,
                  years: plan.years.map((year, i) =>
                    i === yearIndex
                      ? year.map((term, j) =>
                          j === termIndex
                            ? term.filter((_, k) => k !== courseIndex)
                            : term
                        )
                      : year
                  )
                })
              }
            }}
            onDropLocation={(termIndex, courseIndex) => {
              const dragState = dragStateRef.current
              if (!dragState) {
                return
              }
              if (courseIndex !== null) {
                if (
                  dragState.dropLocation !== 'remove' &&
                  dragState.dropLocation?.yearIndex === yearIndex &&
                  dragState.dropLocation.termIndex === termIndex &&
                  dragState.dropLocation.courseIndex === courseIndex
                ) {
                  return
                }
                dragStateRef.current = {
                  ...dragState,
                  dropLocation: { yearIndex, termIndex, courseIndex }
                }
              } else if (
                dragState.dropLocation !== 'remove' &&
                dragState.dropLocation?.yearIndex === yearIndex &&
                dragState.dropLocation.termIndex === termIndex
              ) {
                // Mouse no longer inside term. If drop location was in the
                // term, then set it to null.
                dragStateRef.current = {
                  ...dragState,
                  dropLocation: null
                }
              } else {
                return
              }
              setDragStateVal(dragStateRef.current)
            }}
            key={yearIndex}
          />
        ))}
        {dragStateVal && (
          <RemoveZone
            onDropLocation={inside => {
              const dragState = dragStateRef.current
              if (!dragState) {
                return
              }
              if (inside) {
                if (dragState.dropLocation === 'remove') {
                  return
                }
                dragStateRef.current = {
                  ...dragState,
                  dropLocation: 'remove'
                }
              } else if (dragState.dropLocation === 'remove') {
                dragStateRef.current = {
                  ...dragState,
                  dropLocation: null
                }
              } else {
                return
              }
              setDragStateVal(dragStateRef.current)
            }}
          />
        )}
      </DragContext.Provider>
      {dragStateVal && (
        <Course
          course={dragStateVal.course}
          dragged={{
            width: dragStateVal.width,
            x: dragStateVal.pointerX - dragStateVal.offsetX,
            y: dragStateVal.pointerY - dragStateVal.offsetY
          }}
        />
      )}
    </div>
  )
}

const assumedSatisfied: CourseCode[] = ['MATH 4C', 'AWP 3', 'AWP 4B']
type PrereqCheckProps = {
  code: CourseCode
  reqs: CourseCode[][]
  pastTerms: CourseCode[]
}
function PrereqCheck ({ code, reqs, pastTerms }: PrereqCheckProps) {
  if (reqs.length === 0) {
    return (
      <p class='course-code-line'>
        {code} — <em class='no-prereqs'>No prerequisites</em>
      </p>
    )
  }
  const satisfied = reqs.every(
    req =>
      req.length === 0 ||
      req.some(alt => assumedSatisfied.includes(alt) || pastTerms.includes(alt))
  )
  return (
    <details class='course-code-item' open={!satisfied}>
      <summary class={`course-code ${satisfied ? '' : 'missing-prereq'}`}>
        {code}
      </summary>
      <ul class='reqs'>
        {reqs.map((req, i) => {
          if (req.length === 0) {
            return null
          }
          const satisfied = req.some(
            alt => assumedSatisfied.includes(alt) || pastTerms.includes(alt)
          )
          return (
            <li class={satisfied ? 'satisfied' : 'missing'} key={i}>
              {satisfied ? '✅' : '❌'}
              {req.map((alt, i) => (
                <Fragment key={i}>
                  {i !== 0 ? ' or ' : null}
                  {assumedSatisfied.includes(alt) ? (
                    <strong class='assumed' title='Assumed to be satisfied'>
                      {alt}*
                    </strong>
                  ) : pastTerms.includes(alt) ? (
                    <strong>{alt}</strong>
                  ) : (
                    alt
                  )}
                </Fragment>
              ))}
            </li>
          )
        })}
      </ul>
    </details>
  )
}

type CustomCourseProps = {
  name: string
  reqs: string[][]
  onName: (name: string) => void
  onReqs: (name: string[][]) => void
}
function CustomCourse ({ name, reqs, onName, onReqs }: CustomCourseProps) {
  return (
    <li>
      <input
        type='text'
        value={name}
        onInput={e => onName(e.currentTarget.value)}
      />
    </li>
  )
}

type CustomCourse = {
  name: string
  reqs: string[][]
}
type PrereqSidebarProps = {
  prereqs: Prereqs
  onPrereqs: (newPrereqs: Prereqs) => void
  plan: AcademicPlan
}
function PrereqSidebar ({ prereqs, onPrereqs, plan }: PrereqSidebarProps) {
  const [custom, setCustom] = useState<CustomCourse[]>([])

  const terms = plan.years.flatMap(year =>
    year.map(term => term.map(course => course.title))
  )

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
      <p class='description'>
        For advisors creating a new major or if there's a missing course. Create
        a course with an existing course code to change its prerequisites.
      </p>
      <ul>
        {custom.map(({ name, reqs }, i) => (
          <CustomCourse
            name={name}
            reqs={reqs}
            onName={name =>
              setCustom(custom =>
                custom.map((course, j) =>
                  i === j ? { name, reqs: course.reqs } : course
                )
              )
            }
            onReqs={reqs =>
              setCustom(custom =>
                custom.map((course, j) =>
                  i === j ? { name: course.name, reqs } : course
                )
              )
            }
            key={i}
          />
        ))}
      </ul>
    </aside>
  )
}

type AppProps = {
  prereqs: Prereqs
  initPlan: AcademicPlan
}
function App ({ prereqs: initPrereqs, initPlan }: AppProps) {
  const [plan, setPlan] = useState(initPlan)
  const [prereqs, setPrereqs] = useState(initPrereqs)

  return (
    <>
      <main class='main'>
        <div class='info'>
          <input
            class='plan-name'
            type='text'
            placeholder='Plan name'
            aria-label='Plan name'
            value={plan.name}
            onInput={e => setPlan({ ...plan, name: e.currentTarget.value })}
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
        <Editor plan={plan} onPlan={setPlan} />
      </main>
      <PrereqSidebar prereqs={prereqs} onPrereqs={setPrereqs} plan={plan} />
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
      startYear: '2021',
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
      ],
      name: '2021 CS25-Computer Engineering/Sixth'
    }}
  />,
  document.getElementById('root')!
)
