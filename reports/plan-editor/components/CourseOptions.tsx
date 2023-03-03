/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Prereqs } from '../../util/Prereqs.ts'
import { Course } from '../types.ts'

export type CourseOptionsProps = {
  prereqs?: Prereqs
  course: Course
  onCourse?: (course: Course) => void
  onRemove?: () => void
}
export function CourseOptions ({
  prereqs,
  course,
  onCourse,
  onRemove
}: CourseOptionsProps) {
  return (
    <div class='options-wrapper'>
      {prereqs?.[course.title] && (
        <div class='valid-course'>
          <strong>{course.title}</strong> is a valid course code.
        </div>
      )}
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
