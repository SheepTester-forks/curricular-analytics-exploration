export type MajorCode = string
export type CollegeCode = string

export type StudentsByGroup = Map<
  [major: MajorCode, college: CollegeCode, year: number],
  number
>

export type GroupsByCourseRaw = {
  colleges: [code: CollegeCode, name: string][]
  quarterNames: string[]
  courses: {
    courseCode: string
    takers: [
      year: number,
      quarter: number,
      majorCode: MajorCode,
      collegeCode: CollegeCode,
      forMajor: boolean
    ][]
  }[]
}
