// node --experimental-strip-types summarize_metrics.mts <year>
// -> files/protected/summarize_dfw.json (not used for anything)
//    files/protected/summarize_dfw_by_major.json
//    files/protected/summarize_equity_by_major.json
//    files/protected/summarize_waitlist.json
//    files/protected/summarize_transfer_gap.json
//    files/protected/summarize_major_to_dept.json
//    files/summarize_dfw_public.json

import { readFile, writeFile } from 'fs/promises'
import parse from 'neat-csv'

// for files/summarize_dfw_public.json, see below
const PUBLIC_START_YEAR = +process.argv[2]

const majorDepartments = (
  await parse(await readFile('files/isis_major_code_list.csv', 'utf-8'))
)
  .map(({ 'ISIS Major Code': isisMajorCode, Department: department }) => ({
    majorCode:
      typeof isisMajorCode === 'string'
        ? isisMajorCode
        : expect('ISIS Major Code should be string'),
    majorPrefix:
      typeof isisMajorCode === 'string'
        ? isisMajorCode.slice(0, 2)
        : expect('ISIS Major Code should be string'),
    department:
      typeof department === 'string'
        ? department
        : expect('Department should be string')
  }))
  .filter(entry => {
    const majorNumber = +entry.majorCode.slice(2)
    // Only consider undergrad majors
    return 25 <= majorNumber && majorNumber < 50
  })

// Ensure we can cleanly map from major prefix to department
for (const [prefix, entriesByPrefix] of Map.groupBy(
  majorDepartments,
  entry => entry.majorPrefix
)) {
  const departments = new Set(entriesByPrefix.map(entry => entry.department))
  if (departments.size > 1) {
    console.warn(
      '?',
      'major prefix',
      prefix,
      'encompasses multiple departments',
      departments
      // , entriesByPrefix
    )
  }
}

await writeFile(
  'files/protected/summarize_major_to_dept.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(
        Map.groupBy(majorDepartments, pair => pair.majorPrefix),
        ([majorPrefix, entriesByPrefix]) => [
          majorPrefix,
          entriesByPrefix.find(entry => !entry.department.startsWith('UN'))
            ?.department ?? entriesByPrefix[0].department
        ]
      )
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/protected/summarize_major_to_dept.json')

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

//#region Metrics

type MetricsRow = {
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
    // Transfer Disproportionate Impact
    transfer: boolean
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

const metricsTable = (
  await parse(
    // await readFile('./files/CA_MetricsforMap_FINAL(Metrics).csv', 'utf-8')
    await readFile('../curricular-analytics-scripts/files/CA_MetricsforMap_25_FINAL(Metrics).csv', 'utf-8')
  )
).slice(1)

const metricsRows = metricsTable.map(
  ({
    'Course ID': courseCode,
    'Dept Cd': departmentCode,
    'Major Disproportionate Impact': impactMajor = '',
    'URM Disproportionate Impact': impactUrm = '',
    'First Gen Disproportionate Impact': impactFirstGen = '',
    'Gender Disproportionate Impact': impactGender = '',
    'Transfer Disproportionate Impact': impactTransfer = '',
    N: studentCount,
    'N Qtrs w/Enrollment': quarterCount,
    'Count of DFW Grades': dfwCount,
    '% DFW': dfwPercent,
    'Avg. End Waitlist Count/Qtr': averageWaitlist,
    'Avg. N Students Affected/Offering': averageStudentsAffected
    // 'N Courses Blocked ': _,
    // 'Max. Complexity': _,
    // 'Impact Index': _,
  }): MetricsRow => ({
    courseCode,
    departmentCode,
    disproportionate: {
      major:
        impactMajor === 'Y'
          ? true
          : impactMajor === ''
            ? false
            : expect(
              `expected impactMajor to be either Y or empty, received '${impactMajor}'`
            ),
      urm:
        impactUrm === 'Y'
          ? true
          : impactUrm === ''
            ? false
            : expect(
              `expected impactUrm to be either Y or empty, received '${impactUrm}'`
            ),
      firstGen:
        impactFirstGen === 'Y'
          ? true
          : impactFirstGen === ''
            ? false
            : expect(
              `expected impactFirstGen to be either Y or empty, received '${impactFirstGen}'`
            ),
      gender:
        impactGender === 'Y'
          ? true
          : impactGender === ''
            ? false
            : expect(
              `expected impactGender to be either Y or empty, received '${impactGender}'`
            ),
      transfer: 
        impactTransfer === 'Y'
          ? true
          : impactTransfer === ''
            ? false
            : expect(
              `expected impactTransfer to be either Y or empty, received '${impactTransfer}'`
            )
    },
    studentCount: +studentCount.replace(',', ''),
    quarterCount: +quarterCount,
    dfwCount: +dfwCount.replace(',', ''),
    dfwPercent: +dfwPercent.replace('%', '') / 100,
    averageWaitlist: +averageWaitlist,
    averageStudentsAffected: +averageStudentsAffected
  })
)

const byCourse = Map.groupBy(metricsRows, ({ courseCode }) => courseCode)

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

function displayDisproportionate ({
  firstGen,
  gender,
  major,
  urm,
  transfer
}: MetricsRow['disproportionate']): string {
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
  if (transfer) {
    strings.push('transfer')
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
            rows.map(({ departmentCode, disproportionate }) => [
              departmentCode,
              displayDisproportionate(disproportionate)
            ])
          )
          // allMajors: displayDisproportionate(
          //   rows.reduce<MetricsRow['disproportionate']>(
          //     (cum, curr) => ({
          //       firstGen: cum.firstGen || curr.disproportionate.firstGen,
          //       gender: cum.gender || curr.disproportionate.gender,
          //       major: cum.major || curr.disproportionate.major,
          //       urm: cum.urm || curr.disproportionate.urm
          //     }),
          //     { firstGen: false, gender: false, major: false, urm: false }
          //   )
          // )
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

// For debugging purposes, not used for anything, safe to remove
// console.log(
//   'all departments',
//   Array.from(
//     new Set(metricsRows.map(({ departmentCode }) => departmentCode))
//   ).sort()
// )

//#region Transfer Equity Gaps (Applicant Type)

// NOTE: MATH20C	SE	First Year	Y this is weird

/** map course to whether it is transfer equity gap */
const coursesWithTransferGap = new Map(
  (
    await parse(
      await readFile(
        './files/CA_MetricsforMap_FINAL(Applicant Type).csv',
        'utf-8'
      )
    )
  )
    .slice(1)
    .flatMap(
      ({
        'Course ID': courseCode,
        Breakdown: applicantType,
        'Disproportionate Impact': disproportionateImpact
      }) => {
        if (applicantType !== 'Transfer') {
          if (disproportionateImpact === 'Y') {
            console.warn(
              '?',
              courseCode,
              applicantType,
              'has Disproportionate Impact'
            )
          }
          return []
        }
        return [[courseCode, disproportionateImpact === 'Y']]
      }
    )
)

/** maps department code to their major-specific list of transfer equity gaps */
const coursesWithTransferGapByMajor = Map.groupBy(
  (
    await parse(
      await readFile(
        // './files/CA_MetricsforMap_FINAL(Applicant Type_Major).csv', 'utf-8'
        './files/CA_MetricsforMap_25_FINAL(by Major by App Type).csv', 'utf-8'
      )
    )
  )
    .slice(1)
    .flatMap(
      ({
        'Course ID': courseCode,
        'Dept Cd': departmentCode,
        Breakdown: applicantType,
        'Disproportionate Impact': disproportionateImpact
      }) => {
        if (applicantType !== 'TRAN') {
          if (disproportionateImpact === 'Y') {
            console.warn(
              '?',
              courseCode,
              applicantType,
              'has Disproportionate Impact'
            )
          }
          return []
        }
        return [
          {
            courseCode,
            departmentCode,
            transferGap: disproportionateImpact === 'Y'
          }
        ]
      }
    ),
  entry => entry.courseCode
)

await writeFile(
  'files/protected/summarize_transfer_gap.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(
        new Set(coursesWithTransferGap.keys()).union(
          new Set(coursesWithTransferGapByMajor.keys())
        ),
        courseCode => [
          courseCode,
          {
            ...Object.fromEntries(
              coursesWithTransferGapByMajor
                .get(courseCode)
                ?.map(entry => [entry.departmentCode, entry.transferGap]) ?? []
            ),
            allMajors: coursesWithTransferGap.get(courseCode)
          }
        ]
      )
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/protected/summarize_transfer_gap.json')

await writeFile(
  'files/summarize_dfw_public.json',
  JSON.stringify(
    Object.fromEntries(
      Array.from(
        Map.groupBy(
          (
            await parse(
              await readFile('./scrape_instructor_grade_archive.csv', 'utf-8')
            )
          )
            .slice(1)
            // Filter out old professors
            .filter(
              row =>
                +row['Year'] >= PUBLIC_START_YEAR % 100 &&
                ![
                  row['A'],
                  row['B'],
                  row['C'],
                  row['D'],
                  row['F'],
                  row['W'],
                  row['P'],
                  row['NP']
                ].every(percentage => percentage === '0%')
            )
            .map(row => {
              const abc =
                +row['A'].replace('%', '') +
                +row['B'].replace('%', '') +
                +row['C'].replace('%', '') +
                +row['P'].replace('%', '')
              const dfw =
                +row['D'].replace('%', '') +
                +row['F'].replace('%', '') +
                +row['W'].replace('%', '') +
                +row['NP'].replace('%', '')
              const dfwRate = dfw / (abc + dfw)
              if (Number.isNaN(dfwRate)) {
                throw new RangeError(`DFW rate is NaN: ${JSON.stringify(row)}`)
              }
              return {
                course: row['Subject'] + row['Course'],
                instructor: row['Instructor'],
                dfwRate
              }
            }),
          entry => entry.course
        ),
        ([course, entries]) => {
          const instructors = Array.from(
            Map.groupBy(entries, entry => entry.instructor).values(),
            // Assumes the CSV is in chronological order
            instructorDfws => instructorDfws[instructorDfws.length - 1].dfwRate
          )
          return [
            course,
            // Average latest DFW across all professors
            {
              allMajors:
                instructors.reduce((cum, curr) => cum + curr, 0) /
                instructors.length
            }
          ]
        }
      )
    ),
    null,
    2
  ) + '\n'
)
console.log('wrote files/summarize_dfw_public.json')
