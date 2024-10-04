// deno run -A summarize_metrics.ts './files/CA_MetricsforMap_FINAL(Metrics).csv'
// -> files/protected/summarize_dfw.json
//    files/protected/summarize_dfw_by_major.json
//    files/protected/summarize_waitlist.json

import { parse } from 'https://deno.land/std@0.181.0/csv/parse.ts'

const table = parse(await Deno.readTextFile(Deno.args[0])).slice(1)

function expect (message: string): never {
  throw new TypeError(message)
}

function check<T> (value: T, check: (value: T) => string | null): T {
  const message = check(value)
  if (message !== null) {
    throw new TypeError(message)
  }
  return value
}

type Row = {
  // Course ID
  /** No space, e.g. `AIP197DC` */
  courseCode: string
  // Dept Cd
  /** Seems to represent the major of the student. Can be `No major` */
  departmentCode: string
  disproportionate: {
    // Major Disproportionate Impact
    major: boolean
    // URM Disproportionate Impact
    urm: boolean
    // First Gen Disproportionate Impact
    firstGen: boolean
    // Gender Disproportionate Impact
    gender: boolean
  }
  // N
  studentCount: number
  // N Qtrs w/Enrollment
  /**
   * Number of quarters the course was offered / there was data for. Often seems
   * to be around 8.
   */
  quarterCount: number
  // Count of DFW Grades
  dfwCount: number
  // % DFW
  /** Between 0 and 1 */
  dfwPercent: number
  // Avg. End Waitlist Count/Qtr
  /** At end of quarter */
  averageWaitlist: number
  // Avg. N Students Affected/Offering
  /** Per offering of the course */
  averageStudentsAffected: number

  // Ignored:
  // N Courses Blocked
  // Max. Complexity
  // Impact Index
}

const rows = table.map(
  ([
    courseCode,
    departmentCode,
    impactMajor,
    impactUrm,
    impactFirstGen,
    impactGender,
    studentCount,
    quarterCount,
    dfwCount,
    dfwPercent,
    averageWaitlist,
    averageStudentsAffected
  ]): Row => ({
    courseCode,
    departmentCode,
    disproportionate: {
      major:
        impactMajor === 'Y'
          ? true
          : impactMajor === ''
          ? false
          : expect('expected impactMajor to be either Y or empty'),
      urm:
        impactUrm === 'Y'
          ? true
          : impactUrm === ''
          ? false
          : expect('expected impactUrm to be either Y or empty'),
      firstGen:
        impactFirstGen === 'Y'
          ? true
          : impactFirstGen === ''
          ? false
          : expect('expected impactFirstGen to be either Y or empty'),
      gender:
        impactGender === 'Y'
          ? true
          : impactGender === ''
          ? false
          : expect('expected impactGender to be either Y or empty')
    },
    studentCount: +studentCount,
    quarterCount: +quarterCount,
    dfwCount: +dfwCount,
    dfwPercent: +dfwPercent.replace('%', '') / 100,
    averageWaitlist: +averageWaitlist,
    averageStudentsAffected: +averageStudentsAffected
  })
)

// console.log(rows)

const byCourse = Map.groupBy(rows, ({ courseCode }) => courseCode)

Deno.writeTextFile(
  'files/protected/summarize_dfw.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(byCourse, ([courseCode, rows]) => [
        courseCode,
        rows.reduce((cum, curr) => cum + curr.dfwCount, 0) /
          rows.reduce((cum, curr) => cum + curr.studentCount, 0)
      ])
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/protected/summarize_dfw.json')

Deno.writeTextFile(
  'files/protected/summarize_dfw_by_major.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(byCourse, ([courseCode, rows]) => [
        courseCode,
        {
          ...Object.fromEntries(
            rows.map(
              ({ departmentCode, dfwCount, studentCount, dfwPercent }) => [
                departmentCode,
                check(dfwCount / studentCount, percent =>
                  Math.round(percent * 100) / 100 === dfwPercent
                    ? null
                    : `${courseCode} ${departmentCode}: ${
                        dfwCount / studentCount
                      } =/= ${dfwPercent}`
                )
              ]
            )
          ),
          allMajors:
            rows.reduce((cum, curr) => cum + curr.dfwCount, 0) /
            rows.reduce((cum, curr) => cum + curr.studentCount, 0)
        }
      ])
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/protected/summarize_dfw_by_major.json')

Deno.writeTextFile(
  'files/protected/summarize_waitlist.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(byCourse, ([courseCode, rows]) => [
        courseCode,
        check(
          rows.map(({ averageWaitlist }) => averageWaitlist),
          counts =>
            counts.every(count => count === counts[0])
              ? null
              : `waitlist counts differ ${courseCode}`
        )[0]
      ])
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/protected/summarize_waitlist.json')
