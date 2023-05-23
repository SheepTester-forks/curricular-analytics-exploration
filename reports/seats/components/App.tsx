/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import {
  CoursesByGroupJson,
  isMajorCode,
  StudentsByGroup
} from '../courses-by-major.ts'
import { SeatsNeeded } from './SeatsNeeded.tsx'

export type AppProps = {
  courses: CoursesByGroupJson
}
export function App ({ courses: { _: header, ...courses } }: AppProps) {
  const [students, setStudents] = useState<StudentsByGroup>(() => {
    // Generate random numbers
    const students: StudentsByGroup = { majors: {}, colleges: {} }
    for (const collegeCode of Object.keys(header.colleges)) {
      students.colleges[collegeCode] = 0
    }

    const majors = Object.values(courses).flatMap(course => Object.keys(course))
    for (const major of majors) {
      if (isMajorCode(major)) {
        students.majors[major] = {}
        for (const collegeCode of Object.keys(header.colleges)) {
          const collegeStudents = Math.floor(Math.random() * 21 + 90)
          students.majors[major][collegeCode] = collegeStudents
          students.colleges[collegeCode] += collegeStudents
        }
      }
    }
    return students
  })
  return <SeatsNeeded courses={courses} students={students} />
}
