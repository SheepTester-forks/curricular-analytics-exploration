/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef } from 'preact/hooks'
import { CourseCode, Prereqs } from '../../util/Prereqs.ts'
import {
  CourseCodeLink,
  CourseCodeNode,
  createGraph,
  NodeUpdater
} from '../createGraph.ts'
import { Options } from './Options.tsx'

type Graph = {
  nodes: CourseCodeNode[]
  links: CourseCodeLink[]
}
function getUnlockedCourses ({ prereqs, courses, options }: TreeProps): Graph {
  const allCourses: CourseCodeNode[] = courses.map(course => ({
    course,
    selected: true,
    note: options.unlockedOnly ? null : { type: 'taken' }
  }))
  const taken = new Set(courses)
  const links: CourseCodeLink[] = []
  let newCourses: CourseCodeNode[]
  do {
    newCourses = []
    for (const [courseCode, reqs] of Object.entries(prereqs)) {
      // Skip classes that are unlocked by default
      if (reqs.length === 0 || taken.has(courseCode)) {
        continue
      }
      const linked: Set<CourseCode> = new Set()
      let satisfied = 0
      for (const req of reqs) {
        for (const alt of req) {
          if (taken.has(alt)) {
            linked.add(alt)
            satisfied++
            break
          }
        }
      }
      if (options.unlockedOnly ? satisfied === reqs.length : satisfied > 0) {
        newCourses.push({
          course: courseCode,
          selected: false,
          note: options.unlockedOnly
            ? null
            : { type: 'satisfied', satisfied, total: reqs.length }
        })
        links.push(
          ...Array.from(linked, course => ({
            source: course,
            target: courseCode
          }))
        )
      }
    }
    allCourses.push(...newCourses)
    for (const { course } of newCourses) {
      taken.add(course)
    }
  } while (newCourses.length > 0)
  return { nodes: allCourses, links }
}
function getCoursePrereqs ({ prereqs, courses, options }: TreeProps): Graph {
  const nodes: CourseCodeNode[] = courses.map(course => {
    const reqs = prereqs[course] ?? []
    return {
      course,
      selected: true,
      note: options.allAlts
        ? { type: 'reqs', count: reqs.length ?? 0 }
        : {
            type: 'omitted-alts',
            count: (reqs.flat().length ?? 0) - (reqs.length ?? 0)
          }
    }
  })
  const links: CourseCodeLink[] = []
  const included = new Set(courses)
  let nextCourses = [...courses]
  do {
    const toIter = nextCourses
    nextCourses = []
    for (const course of toIter) {
      if (!prereqs[course]) {
        continue
      }
      for (const req of prereqs[course]) {
        for (const alt of options.allAlts ? req : [req[0]]) {
          if (!included.has(alt)) {
            nextCourses.push(alt)
            included.add(alt)
            const reqs = prereqs[alt] ?? []
            nodes.push({
              course: alt,
              selected: false,
              note: options.allAlts
                ? { type: 'reqs', count: reqs.length ?? 0 }
                : {
                    type: 'omitted-alts',
                    count: (reqs.flat().length ?? 0) - (reqs.length ?? 0)
                  }
            })
          }
          links.push({
            source: alt,
            target: course,
            required: req.length === 1
          })
        }
      }
    }
  } while (nextCourses.length > 0)
  return { nodes, links }
}

export type TreeProps = {
  prereqs: Prereqs
  courses: CourseCode[]
  options: Options
}
export function Tree (props: TreeProps) {
  const { prereqs, courses, options } = props
  const wrapperRef = useRef<HTMLDivElement>(null)
  const updateRef = useRef<NodeUpdater>()

  useEffect(() => {
    if (!wrapperRef.current) {
      return
    }
    const subjects = [
      ...new Set(Object.keys(prereqs).map(code => code.split(' ')[0]))
    ].sort()
    // Manually shuffling subject codes until I like the colors I get
    // https://observablehq.com/@d3/color-schemes
    subjects.push(subjects.shift()!, subjects.shift()!)
    subjects.unshift('CSE', 'ECE', 'DSC', 'MATH', 'MAE', 'COGS')
    const { update, destroy } = createGraph(wrapperRef.current, subjects)
    updateRef.current = update
    return destroy
  }, [wrapperRef.current, prereqs])

  useEffect(() => {
    if (!updateRef.current) {
      return
    }
    const { nodes, links } =
      options.mode === 'blocked'
        ? getUnlockedCourses(props)
        : getCoursePrereqs(props)
    updateRef.current(nodes, links)
  }, [updateRef.current, courses, options])

  return (
    <>
      <div class='canvas-wrapper' ref={wrapperRef}></div>
    </>
  )
}
