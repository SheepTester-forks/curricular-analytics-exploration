/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import type { JSX } from 'preact/jsx-runtime'
import { Course } from '../types.ts'

export type CourseProps = {
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
export function Course ({
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
