/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Fragment } from 'preact'
import { useContext, useMemo, useRef } from 'preact/hooks'
import type { JSX } from 'preact/jsx-runtime'
import { DragContext } from '../drag-drop.ts'
import { TermPlan } from '../types.ts'
import { Course } from './Course.tsx'

const Placeholder = () => <li class='placeholder-course'></li>

const COURSE_HEIGHT = 30
const emptyCourse = {
  title: '',
  units: '4',
  requirement: { college: false, major: false }
}
export type TermProps = {
  name: string
  plan: TermPlan
  onPlan: (plan: TermPlan) => void
  onDrag?: (
    event: JSX.TargetedPointerEvent<HTMLElement>,
    course: number
  ) => void
  onDropLocation?: (index: number | null) => void
}
export function Term ({
  name,
  plan,
  onPlan,
  onDrag,
  onDropLocation
}: TermProps) {
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
                onRemove={() => onPlan(plan.filter((_, j) => j !== i))}
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
