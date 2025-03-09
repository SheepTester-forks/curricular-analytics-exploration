import { CourseCode } from '../util/Prereqs'

// TODO: Remove

export type MajorCode = string
export type CollegeCode = string

export type CoursesByGroup = Record<
  CourseCode,
  | Record<MajorCode, true | CollegeCode[]>
  | Record<CollegeCode, true | MajorCode[]>
>
export type CoursesByGroupJson = {
  _: {
    colleges: Record<CollegeCode, string>
  }
} & CoursesByGroup

export type MajorStudents = Record<CollegeCode, number>
export type StudentsByGroup = {
  majors: Record<MajorCode, MajorStudents>
  colleges: Record<CollegeCode, number>
}

export function isMajorCode (code: MajorCode | CollegeCode): code is MajorCode {
  return code.length === 4
}
