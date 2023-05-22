/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { CoursesByMajor } from '../courses_by_major.ts'

export type AppProps = {
  courses: CoursesByMajor
}
export function App ({ courses }: AppProps) {
  return <></>
}
