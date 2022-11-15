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
type ForceGraphOptions = {
  /** given d in nodes, returns a unique identifier (string) */
  nodeId: (d: Node, index: number) => string
  /** given d in nodes, returns an (ordinal) value for color */
  nodeGroup: (d: Node, index: number) => number
  /** an array of ordinal values representing the node groups */
  nodeGroups: number[]
  /** given d in nodes, a title string */
  nodeTitle: (d: Node, index: number) => string
  /** node stroke fill (if not using a group color encoding) */
  nodeFill: string
  /** node stroke color */
  nodeStroke: string
  /** node stroke width, in pixels */
  nodeStrokeWidth: number
  /** node stroke opacity */
  nodeStrokeOpacity: number
  /** node radius, in pixels */
  nodeRadius: number
  nodeStrength: number
  /** given d in links, returns a node identifier string */
  linkSource: (d: Link, index: number) => string
  /** given d in links, returns a node identifier string */
  linkTarget: (d: Link, index: number) => string
  /** link stroke color */
  linkStroke: string | ((d: Link, index: number) => string)
  /** link stroke opacity */
  linkStrokeOpacity: number
  /** given d in links, returns a stroke width in pixels */
  linkStrokeWidth: number | ((d: Link, index: number) => number)
  /** link stroke linecap */
  linkStrokeLinecap: string
  linkStrength: number
  /** an array of color strings, for the node groups */
  colors: readonly string[]
  /** outer width, in pixels */
  width: number
  /** outer height, in pixels */
  height: number
  /** when this promise resolves, stop the simulation */
  invalidation: Promise<void>
}

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/force-directed-graph
 */
function ForceGraph (
  { nodes, links }: ForceGraphArgs,
  {
    nodeId = d => d.id,
    nodeGroup,
    nodeGroups = [],
    nodeTitle,
    nodeFill = 'currentColor',
    nodeStroke = '#fff',
    nodeStrokeWidth = 1.5,
    nodeStrokeOpacity = 1,
    nodeRadius = 5,
    nodeStrength,
    linkSource = ({ source }) => source,
    linkTarget = ({ target }) => target,
    linkStroke = '#999',
    linkStrokeOpacity = 0.6,
    linkStrokeWidth = 1.5,
    linkStrokeLinecap = 'round',
    linkStrength,
    colors = d3.schemeTableau10,
    width = 640,
    height = 400,
    invalidation
  }: Partial<ForceGraphOptions> = {}
) {
  // Compute values.
  const nodeIds = d3.map(nodes, nodeId)
  const sources = d3.map(links, linkSource)
  const targets = d3.map(links, linkTarget)
  if (nodeTitle === undefined) nodeTitle = (_, i) => nodeIds[i]
  const titles = nodeTitle == null ? null : d3.map(nodes, nodeTitle)
  const groups = nodeGroup == null ? null : d3.map(nodes, nodeGroup)
  const widths =
    typeof linkStrokeWidth !== 'function'
      ? null
      : d3.map(links, linkStrokeWidth)
  const L = typeof linkStroke !== 'function' ? null : d3.map(links, linkStroke)

  // Replace the input nodes and links with mutable objects for the simulation.
  const nodesMut = d3.map(nodes, (_, i) => ({ id: nodeIds[i] }))
  const linksMut = d3.map(links, (_, i) => ({
    source: sources[i],
    target: targets[i]
  }))

  // Compute default domains.
  if (groups && nodeGroups === undefined) nodeGroups = d3.sort(groups)

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors)

  // Construct the forces.
  const forceNode = d3.forceManyBody()
  const forceLink = d3.forceLink(linksMut).id(({ index: i }) => nodeIds[i]!)
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength)
  if (linkStrength !== undefined) forceLink.strength(linkStrength)

  const simulation = d3
    .forceSimulation(nodesMut as d3.SimulationNodeDatum[])
    .force('link', forceLink)
    .force('charge', forceNode)
    .force('center', d3.forceCenter())
    .on('tick', ticked)

  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')

  const link = svg
    .append('g')
    .attr('stroke', typeof linkStroke !== 'function' ? linkStroke : '')
    .attr('stroke-opacity', linkStrokeOpacity)
    .attr(
      'stroke-width',
      typeof linkStrokeWidth !== 'function' ? linkStrokeWidth : ''
    )
    .attr('stroke-linecap', linkStrokeLinecap)
    .selectAll('line')
    .data(linksMut as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
    .join('line')

  const temp = svg
    .append('g')
    .attr('fill', nodeFill)
    .attr('stroke', nodeStroke)
    .attr('stroke-opacity', nodeStrokeOpacity)
    .attr('stroke-width', nodeStrokeWidth)
    .selectAll('circle') as d3.Selection<
    SVGCircleElement,
    unknown,
    SVGElement,
    undefined
  >
  const node = temp
    .data(nodesMut as d3.SimulationNodeDatum[])
    .join('circle')
    .attr('r', nodeRadius)
    .call(drag())

  if (widths) link.attr('stroke-width', ({ index: i }) => widths[i!])
  if (L) link.attr('stroke', ({ index: i }) => L[i!])
  if (groups && color) node.attr('fill', ({ index: i }) => color(groups[i!]))
  if (titles) node.append('title').text(({ index: i }) => titles[i!])
  if (invalidation != null) invalidation.then(() => simulation.stop())

  function ticked () {
    link
      .attr('x1', d => (typeof d.source === 'object' ? d.source.x! : ''))
      .attr('y1', d => (typeof d.source === 'object' ? d.source.y! : ''))
      .attr('x2', d => (typeof d.target === 'object' ? d.target.x! : ''))
      .attr('y2', d => (typeof d.target === 'object' ? d.target.y! : ''))

    node.attr('cx', d => d.x!).attr('cy', d => d.y!)
  }

  function drag (): d3.DragBehavior<
    d3.BaseType | Element,
    d3.SimulationNodeDatum,
    d3.SimulationNodeDatum
  > {
    type DragEvent = d3.D3DragEvent<Element, unknown, d3.SimulationNodeDatum>

    function dragstarted (event: DragEvent) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged (event: DragEvent) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended (event: DragEvent) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return d3
      .drag<Element, d3.SimulationNodeDatum>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
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
    const chart = ForceGraph(miserables, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `${d.id}\n${d.group}`,
      linkStrokeWidth: l => Math.sqrt(l.value),
      // width,
      height: 600,
      invalidation: new Promise(() => {})
    })
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
