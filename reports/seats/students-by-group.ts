export type MajorCode = string
export type CollegeCode = string

export type GroupCount = Map<
  [major: MajorCode, college: CollegeCode, year: number],
  number
>
