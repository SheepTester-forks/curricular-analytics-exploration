import { useState } from 'react'
import { Prereqs } from '../../util/Prereqs'
import { CourseAdder } from './CourseAdder'
import { Options } from './Options'
import { Tree } from './Tree'

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
