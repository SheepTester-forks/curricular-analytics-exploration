/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import {
  CoursesByMajorJson,
  isMajorCode,
  StudentsByMajor
} from '../courses-by-major.ts'
import { SeatsNeeded } from './SeatsNeeded.tsx'

export type AppProps = {
  courses: CoursesByMajorJson
}
export function App ({ courses: { _: header, ...courses } }: AppProps) {
  const [students, setStudents] = useState<StudentsByMajor>(() => {
    // Generate random numbers
    const students: StudentsByMajor = {}
    const majors = Object.values(courses).flatMap(course => Object.keys(course))
    for (const major of majors) {
      if (isMajorCode(major)) {
        students[major] = { total: 0, colleges: {} }
        for (const collegeCode of Object.keys(header)) {
          const collegeStudents = Math.floor(Math.random() * 21 + 90)
          students[major].colleges[collegeCode] = collegeStudents
          students[major].total += collegeStudents
        }
      }
    }
    return students
  })
  return <SeatsNeeded courses={courses} students={students} />
}
