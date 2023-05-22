import { CourseCode } from '../util/Prereqs.ts'

export type CoursesByMajor = Record<
  CourseCode,
  Record<string, boolean | string[]>
>
