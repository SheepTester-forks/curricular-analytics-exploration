import {
  CoursesByGroup,
  isMajorCode,
  StudentsByGroup
} from '../courses-by-major'

export type SeatsNeededProps = {
  courses: CoursesByGroup
  students: StudentsByGroup
}
export function SeatsNeeded ({ courses, students }: SeatsNeededProps) {
  console.log(students)

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
            // TODO: exceptions
            .filter(([, value]) => value === true)
            .map(([code]) =>
              isMajorCode(code)
                ? Object.entries(students.majors?.[code] ?? {})
                  .map(([collegeCode, students]) =>
                    // Don't double count major/GE overlap
                    enrollers[collegeCode] === true ? 0 : students
                  )
                  .reduce((cum, curr) => cum + curr, 0)
                : students.colleges[code]
            )
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
