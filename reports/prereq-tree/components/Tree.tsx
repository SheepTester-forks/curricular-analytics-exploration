/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef } from 'preact/hooks'
import { CourseCode, Prereqs } from '../../util/Prereqs.ts'
import {
  CourseCodeLink,
  CourseCodeNode,
  ForceDirectedGraph,
  NodeUpdater
} from '../graphs/ForceDirectedGraph.ts'
import { TidyTree } from '../graphs/TidyTree.ts'
import { Options } from './Options.tsx'

type Graph = {
  nodes: CourseCodeNode[]
  links: CourseCodeLink[]
}
function getUnlockedCourses ({ prereqs, courses, options }: TreeProps): Graph {
  let allCourses: Record<string, CourseCodeNode> = Object.fromEntries(
    courses.map(course => [
      course,
      {
        course,
        selected: true,
        dependents: [],
        note: options.unlockedOnly ? null : { type: 'taken' }
      }
    ])
  )
  const links: CourseCodeLink[] = []
  let newCourses: Record<string, CourseCodeNode>
  do {
    newCourses = {}
    for (const [courseCode, reqs] of Object.entries(prereqs)) {
      // Skip classes that are unlocked by default
      if (reqs.length === 0 || allCourses[courseCode]) {
        continue
      }
      const linked: Set<CourseCodeNode> = new Set()
      let satisfied = 0
      for (const req of reqs) {
        for (const alt of req) {
          if (allCourses[alt]) {
            linked.add(allCourses[alt])
            satisfied++
            break
          }
        }
      }
      if (options.unlockedOnly ? satisfied === reqs.length : satisfied > 0) {
        newCourses[courseCode] = {
          course: courseCode,
          selected: false,
          dependents: [],
          note: options.unlockedOnly
            ? null
            : { type: 'satisfied', satisfied, total: reqs.length }
        }
        for (const source of linked) {
          links.push({
            source: source.course,
            target: courseCode
          })
          source.dependents.push(courseCode)
        }
      }
    }
    allCourses = { ...allCourses, ...newCourses }
  } while (Object.keys(newCourses).length > 0)
  return { nodes: Object.values(allCourses), links }
}
function getCoursePrereqs ({ prereqs, courses, options }: TreeProps): Graph {
  const nodes: CourseCodeNode[] = courses.map(course => {
    const reqs = prereqs[course] ?? []
    return {
      course,
      selected: true,
      dependents: [], // not used
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
              dependents: [], // not used
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
    if (options.mode === 'prereqs' && options.tidyTree) {
      const graph = new TidyTree(wrapperRef.current, subjects)
      updateRef.current = (nodes, links) => {
        graph.update([
          ...nodes
            .filter(({ selected }) => selected)
            .map(({ course }) => ({ course, parent: null })),
          ...links.map(({ source, target }) => ({
            course: source,
            parent: target
          }))
        ])
      }
      return () => graph.destroy()
    } else {
      const graph = new ForceDirectedGraph(wrapperRef.current, subjects)
      updateRef.current = graph.update
      return () => graph.destroy()
    }
  }, [wrapperRef.current, prereqs, options.tidyTree])

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
