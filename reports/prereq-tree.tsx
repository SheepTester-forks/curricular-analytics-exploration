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

// HACK to allow Selection.transition()
import type { Selection } from 'https://cdn.skypack.dev/-/d3-selection@v3.0.0-sAmQ3giCT8irML5wz1T1/dist=es2019,mode=types/index.d.ts'
declare module 'https://cdn.skypack.dev/-/d3-selection@v3.0.0-sAmQ3giCT8irML5wz1T1/dist=es2019,mode=types/index.d.ts' {
  interface Selection<
    GElement extends d3.BaseType,
    Datum,
    PElement extends d3.BaseType,
    PDatum
  > {
    transition(name?: string): d3.Transition<GElement, Datum, PElement, PDatum>
  }
}

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

type CourseNode = d3.SimulationNodeDatum & { course: CourseCode }
type CourseLink = d3.SimulationLinkDatum<CourseNode>
type DragEvent = d3.D3DragEvent<SVGCircleElement, unknown, CourseNode>

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/force-directed-graph
 * Updating nodes: https://observablehq.com/@d3/build-your-own-graph
 */
function createGraph (wrapper: ParentNode): () => void {
  const nodes: CourseNode[] = []
  const links: CourseLink[] = []
  for (let i = 50; i--; ) {
    nodes.push({
      course: `${['CSE', 'MATH', 'PHYS', 'ECE'][i % 4]} ${(i / 4) | 0}`
    })
  }
  for (let i = 30; i--; ) {
    links.push({
      source: nodes[(Math.random() * 50) | 0].course,
      target: nodes[(Math.random() * 50) | 0].course
    })
  }
  // TODO: prevent nodes from going off screen

  const color = d3.scaleOrdinal(
    d3.sort(nodes.map(({ course }) => course.split(' ')[0])),
    d3.schemeTableau10
  )

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3.forceLink<CourseNode, CourseLink>(links).id(({ course }) => course)
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter())
    .on('tick', () => {
      node.attr('cx', d => d.x!).attr('cy', d => d.y!)
      link
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x! : ''))
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y! : ''))
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x! : ''))
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y! : ''))
    })

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

  // Links first so the nodes are on top
  let link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)
    .attr('stroke-linecap', 'round')
    .selectAll<SVGLineElement, CourseLink>('line')

  const drag = d3
    .drag<SVGCircleElement, CourseNode>()
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
  let node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll<SVGCircleElement, CourseNode>('circle')
  node.append('title').text(({ course }) => course)

  const chart = Object.assign(svg.node()!, { scales: { color } })
  wrapper.append(chart)

  // TODO: Update
  const update = () => {
    link = link.data(links).join('line')

    node = node.data(nodes).join(
      enter =>
        enter
          .append('circle')
          .attr('r', 0)
          .call(enter =>
            enter
              .transition()
              .attr('r', 5)
              .attr('fill', ({ course }) => color(course.split(' ')[0]))
          )
          .call(drag),
      update => update,
      exit => exit.remove()
    )

    simulation.nodes(nodes)
    simulation.force<d3.ForceLink<CourseNode, CourseLink>>('link')?.links(links)
    simulation.alpha(1).restart()
  }
  update()

  return () => {
    self.removeEventListener('resize', resize)
    chart.remove()
    simulation.stop()
  }
}

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
    return createGraph(wrapperRef.current)
  }, [wrapperRef.current])

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
