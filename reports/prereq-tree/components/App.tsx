/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { Prereqs } from '../../util/Prereqs.ts'
import { CourseAdder } from './CourseAdder.tsx'
import { Options } from './Options.tsx'
import { Tree } from './Tree.tsx'

export type AppProps = {
  prereqs: Prereqs
}
export function App ({ prereqs }: AppProps) {
  const [courses, setCourses] = useState<string[]>([])
  const [options, setOptions] = useState<Options>({
    mode: 'blocked',
    unlockedOnly: false,
    allAlts: true,
    tidyTree: false
  })

  return (
    <>
      <CourseAdder
        courseCodes={Object.keys(prereqs)}
        selected={courses}
        onSelected={setCourses}
      />
      <Options
        options={options}
        onOptions={newOptions =>
          setOptions(options => ({ ...options, ...newOptions }))
        }
      />
      <Tree prereqs={prereqs} courses={courses} options={options} />
    </>
  )
}
