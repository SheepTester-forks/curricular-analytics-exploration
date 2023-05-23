/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import {
  CoursesByMajor,
  isMajorCode,
  StudentsByMajor
} from '../courses-by-major.ts'

export type SeatsNeededProps = {
  courses: CoursesByMajor
  students: StudentsByMajor
}
export function SeatsNeeded ({ courses, students }: SeatsNeededProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Course code</th>
          <th>Seats needed</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(courses).map(([courseCode, enrollers]) => {
          const seats = Object.entries(enrollers)
            .filter(([code, value]) => value === true && isMajorCode(code))
            .map(([majorCode]) => students?.[majorCode].total ?? 0)
            .reduce((cum, curr) => cum + curr, 0)
          return (
            <tr key={courseCode}>
              <td>{courseCode}</td>
              <td>{seats}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
