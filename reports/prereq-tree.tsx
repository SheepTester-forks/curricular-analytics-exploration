/** @jsxImportSource https://esm.sh/preact@10.11.2 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.11.2'
import {
  useEffect,
  useRef,
  useState
} from 'https://esm.sh/preact@10.11.2/hooks'
import * as d3 from 'https://cdn.skypack.dev/d3@7.6.1?dts'

type CourseCode = string
type Prereqs = Record<CourseCode, CourseCode[][]>

type CourseAdderProps = {
  courseCodes: CourseCode[]
  selected: CourseCode[]
  onSelected: (selected: CourseCode[]) => void
}
function CourseAdder ({ courseCodes, selected, onSelected }: CourseAdderProps) {
  const [query, setQuery] = useState('')

  const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
  const queryValid =
    courseCodes.includes(courseCode) && !selected.includes(courseCode)

  return (
    <ul class='course-adder'>
      {selected.map(courseCode => (
        <li key={courseCode} class='added-course'>
          {courseCode}
          <button
            class='remove-course'
            onClick={() => {
              onSelected(selected.filter(code => code !== courseCode))
            }}
          >
            ×
          </button>
        </li>
      ))}
      <li>
        <form
          class='course-adder-form'
          onSubmit={e => {
            const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
            if (courseCodes.includes(courseCode)) {
              if (!selected.includes(courseCode)) {
                onSelected([...selected, courseCode])
              }
              setQuery('')
            }
            e.preventDefault()
          }}
        >
          <input
            class='add-course'
            type='search'
            name='course-code'
            list='courses'
            placeholder='Search for a course'
            autofocus
            value={query}
            onInput={e => {
              setQuery(e.currentTarget.value)
            }}
          />
          <input
            class='add-btn'
            type='submit'
            value='Add'
            disabled={!queryValid}
          />
        </form>
        <datalist id='courses'>
          {courseCodes.map(code => (
            <option value={code} key={code} />
          ))}
        </datalist>
      </li>
    </ul>
  )
}

function courseUnlocked (reqs: CourseCode[][], taken: CourseCode[]): boolean {
  for (const req of reqs) {
    for (const alt of req) {
      if (taken.includes(alt)) {
        return true
      }
    }
  }
  return false
}

function getUnlockedCourses (
  prereqs: Prereqs,
  taken: CourseCode[]
): CourseCode[] {
  const newCourses: CourseCode[] = []
  for (const [courseCode, reqs] of Object.entries(prereqs)) {
    // Skip classes that are unlocked by default
    if (reqs.length === 0) {
      continue
    }
    if (!taken.includes(courseCode) && courseUnlocked(reqs, taken)) {
      newCourses.push(courseCode)
    }
  }
  return newCourses
}

type Node = {
  id: string
  group: number
}
type Link = {
  source: string
  target: string
  value: number
}
type ForceGraphArgs = {
  /** an iterable of node objects (typically [{id}, …]) */
  nodes: Node[]
  /** an iterable of link objects (typically [{source, target}, …]) */
  links: Link[]
}

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/force-directed-graph
 */
function ForceGraph ({ nodes, links }: ForceGraphArgs) {
  // Compute values.
  const nodeIds = nodes.map(d => d.id)
  const sources = links.map(({ source }) => source)
  const targets = links.map(({ target }) => target)
  const groups = nodes.map(d => d.group)

  type SimNode = d3.SimulationNodeDatum & { id: string }
  // Replace the input nodes and links with mutable objects for the simulation.
  const nodesMut: SimNode[] = nodes.map((_, i) => ({ id: nodeIds[i] }))
  const linksMut: d3.SimulationLinkDatum<SimNode>[] = links.map((_, i) => ({
    source: sources[i],
    target: targets[i]
  }))

  // Construct the scales.
  const color = d3.scaleOrdinal(d3.sort(groups), d3.schemeTableau10)

  const simulation = d3
    .forceSimulation(nodesMut)
    .force(
      'link',
      d3.forceLink(linksMut).id(({ index: i }) => nodeIds[i!])
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter())
    .on('tick', ticked)

  const svg = d3.create('svg')

  function resize () {
    const width = window.innerWidth
    const height = window.innerHeight
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
  }
  resize()
  self.addEventListener('resize', resize)

  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)
    .attr('stroke-linecap', 'round')
    .selectAll('line')
    .data(linksMut)
    .join('line')

  const temp = svg
    .append('g')
    .attr('fill', 'currentColor')
    .attr('stroke', '#fff')
    .attr('stroke-opacity', 1)
    .attr('stroke-width', 1.5)
    .selectAll('circle') as d3.Selection<
    Element,
    unknown,
    SVGElement,
    undefined
  >
  type DragEvent = d3.D3DragEvent<Element, unknown, SimNode>
  const node = temp
    .data(nodesMut)
    .join('circle')
    .attr('r', 5)
    .call(
      d3
        .drag<Element, SimNode>()
        .on('start', (event: DragEvent) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          event.subject.fx = event.subject.x
          event.subject.fy = event.subject.y
        })
        .on('drag', (event: DragEvent) => {
          event.subject.fx = event.x
          event.subject.fy = event.y
        })
        .on('end', (event: DragEvent) => {
          if (!event.active) simulation.alphaTarget(0)
          event.subject.fx = null
          event.subject.fy = null
        })
    )

  if (groups && color) node.attr('fill', ({ index: i }) => color(groups[i!]))

  function ticked () {
    link
      .attr('x1', d => (typeof d.source === 'object' ? d.source.x! : ''))
      .attr('y1', d => (typeof d.source === 'object' ? d.source.y! : ''))
      .attr('x2', d => (typeof d.target === 'object' ? d.target.x! : ''))
      .attr('y2', d => (typeof d.target === 'object' ? d.target.y! : ''))

    node.attr('cx', d => d.x!).attr('cy', d => d.y!)
  }

  return Object.assign(svg.node()!, { scales: { color } })
}

import miserables from '/mnt/c/Users/seant/Downloads/miserables.json' assert { type: 'json' }

type TreeProps = {
  prereqs: Prereqs
  courses: CourseCode[]
}
function Tree ({ prereqs, courses }: TreeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wrapperRef.current) {
      return
    }
    const chart = ForceGraph(miserables)
    wrapperRef.current.append(chart)
    return () => {
      chart.remove()
    }
  })

  useEffect(() => {
    const nodes = [...courses]
    let added = true
    while (added) {
      const unlocked = getUnlockedCourses(prereqs, nodes)
      added = unlocked.length > 0
      nodes.push(...unlocked)
    }

    //
  }, [courses])

  return (
    <>
      <div class='canvas-wrapper' ref={wrapperRef}></div>
    </>
  )
}

type AppProps = {
  prereqs: Prereqs
}
function App ({ prereqs }: AppProps) {
  const [courses, setCourses] = useState<string[]>([])

  return (
    <>
      <CourseAdder
        courseCodes={Object.keys(prereqs)}
        selected={courses}
        onSelected={setCourses}
      />
      <Tree prereqs={prereqs} courses={courses} />
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
  />,
  document.getElementById('root')!
)
