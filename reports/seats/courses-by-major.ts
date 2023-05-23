import { CourseCode } from '../util/Prereqs.ts'

export type MajorCode = string
export type CollegeCode = string

export type CoursesByMajor = Record<
  CourseCode,
  | Record<MajorCode, true | CollegeCode[]>
  | Record<CollegeCode, true | MajorCode[]>
>
export type CoursesByMajorJson = {
  _: {
    colleges: Record<CollegeCode, string>
  }
} & CoursesByMajor

export type MajorStudents = {
  total: number
  colleges: Record<CollegeCode, number>
}
export type StudentsByMajor = Record<MajorCode, MajorStudents>

export function isMajorCode (code: MajorCode | CollegeCode): code is MajorCode {
  return code.length === 4
}
