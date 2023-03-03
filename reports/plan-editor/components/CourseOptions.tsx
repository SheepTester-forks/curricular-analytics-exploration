/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Course } from '../types.ts'
import { Toggle } from './Toggle.tsx'

export type CourseOptionsProps = {
  course: Course
  onCourse?: (course: Course) => void
  onRemove?: () => void
}
export function CourseOptions ({
  course,
  onCourse,
  onRemove
}: CourseOptionsProps) {
  return (
    <div class='options-wrapper'>
      <div class='options-body'>
        <label class='toggle-wrapper'>
          <input
            type='checkbox'
            checked={course.requirement.major}
            onInput={e =>
              onCourse?.({
                ...course,
                requirement: {
                  ...course.requirement,
                  major: e.currentTarget.checked
                }
              })
            }
          />
          Major requirement
        </label>
        <label class='toggle-wrapper'>
          <input
            type='checkbox'
            checked={course.requirement.college}
            onInput={e =>
              onCourse?.({
                ...course,
                requirement: {
                  ...course.requirement,
                  college: e.currentTarget.checked
                }
              })
            }
          />
          College GE requirement
        </label>
      </div>
      <button class='remove-course-btn' onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}
