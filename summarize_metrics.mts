// node --experimental-strip-types summarize_metrics.mts './files/CA_MetricsforMap_FINAL(Metrics).csv'
// -> files/protected/summarize_dfw.json
//    files/protected/summarize_dfw_by_major.json
//    files/protected/summarize_equity_by_major.json
//    files/protected/summarize_waitlist.json

import { readFile, writeFile } from 'fs/promises'
import parse from 'neat-csv'

const [, , ...args] = process.argv

const table = (await parse(await readFile(args[0], 'utf-8'))).slice(1)

const majorByDepartment = Object.groupBy(
  (await parse(await readFile('files/isis_major_code_list.csv', 'utf-8'))).map(
    ({ 'ISIS Major Code': isMajorCode, Department: department }) => ({
      majorCode:
        typeof isMajorCode === 'string'
          ? isMajorCode
          : expect('ISIS Major Code should be string'),
      department:
        typeof department === 'string'
          ? department
          : expect('Department should be string')
    })
  ),
  ({ department }) => department
)

const majorSubjByDeptEntries = Object.entries(majorByDepartment).map(
  ([dept, majors]): [string, string[]] => [
    dept,
    Array.from(new Set(majors?.map(major => major.majorCode.slice(0, 2))))
  ]
)
const majorSubjByDept = Object.fromEntries(majorSubjByDeptEntries)
for (const [dept, majorCodes] of majorSubjByDeptEntries) {
  for (const [dept2, majorCodes2] of majorSubjByDeptEntries) {
    if (dept === dept2) {
      continue
    }
    const dupe = majorCodes.find(code => majorCodes2.includes(code))
    if (dupe) {
      console.warn('dept', dept, 'major', dupe, 'also in dept', dept2)
    }
  }
}

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
  ({
    'Course ID': courseCode,
    'Dept Cd': departmentCode,
    'Major Disproportionate Impact': impactMajor,
    'URM Disproportionate Impact': impactUrm,
    'First Gen Disproportionate Impact': impactFirstGen,
    'Gender Disproportionate Impact': impactGender,
    N: studentCount,
    'N Qtrs w/Enrollment': quarterCount,
    'Count of DFW Grades': dfwCount,
    '% DFW': dfwPercent,
    'Avg. End Waitlist Count/Qtr': averageWaitlist,
    'Avg. N Students Affected/Offering': averageStudentsAffected
    // 'N Courses Blocked ': _,
    // 'Max. Complexity': _,
    // 'Impact Index': _,
  }): Row => ({
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

await writeFile(
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

await writeFile(
  'files/protected/summarize_dfw_by_major.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(byCourse, ([courseCode, rows]) => [
        courseCode,
        {
          ...Object.fromEntries(
            rows.flatMap(
              ({ departmentCode, dfwCount, studentCount, dfwPercent }) =>
                majorSubjByDept[departmentCode]?.map(majorCode => [
                  majorCode,
                  check(dfwCount / studentCount, percent =>
                    Math.round(percent * 100) / 100 === dfwPercent
                      ? null
                      : `${courseCode} ${departmentCode}: ${
                        dfwCount / studentCount
                      } =/= ${dfwPercent}`
                  )
                ]) ?? []
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

function displayDisproportionate ({
  firstGen,
  gender,
  major,
  urm
}: Row['disproportionate']): string {
  const strings: string[] = []
  if (firstGen) {
    strings.push('firstGen')
  }
  if (gender) {
    strings.push('gender')
  }
  if (major) {
    strings.push('major')
  }
  if (urm) {
    strings.push('urm')
  }
  return strings.join(' ')
}
await writeFile(
  'files/protected/summarize_equity_by_major.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(byCourse, ([courseCode, rows]) => [
        courseCode,
        {
          ...Object.fromEntries(
            rows.flatMap(
              ({ departmentCode, disproportionate }) =>
                majorSubjByDept[departmentCode]?.map(majorCode => [
                  majorCode,
                  displayDisproportionate(disproportionate)
                ]) ?? []
            )
          ),
          allMajors: displayDisproportionate(
            rows.reduce<Row['disproportionate']>(
              (cum, curr) => ({
                firstGen: cum.firstGen || curr.disproportionate.firstGen,
                gender: cum.gender || curr.disproportionate.gender,
                major: cum.major || curr.disproportionate.major,
                urm: cum.urm || curr.disproportionate.urm
              }),
              { firstGen: false, gender: false, major: false, urm: false }
            )
          )
        }
      ])
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/protected/summarize_equity_by_major.json')

await writeFile(
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

console.log(
  'all departments',
  Array.from(new Set(rows.map(({ departmentCode }) => departmentCode))).sort()
)
