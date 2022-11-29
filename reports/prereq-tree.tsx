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
  const lastCourseRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
  const queryValid =
    courseCodes.includes(courseCode) && !selected.includes(courseCode)

  return (
    <ul class='course-adder'>
      {selected.map((courseCode, i) => (
        <li key={courseCode} class='added-course'>
          {courseCode}
          <button
            class='remove-course'
            ref={i === selected.length - 1 ? lastCourseRef : null}
            onClick={() => {
              onSelected(selected.filter(code => code !== courseCode))
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace') {
                onSelected(selected.filter(code => code !== courseCode))
                inputRef.current?.focus()
                // Input loses focus immediately if deleting last non-first
                // course for some reason. Force it to focus.
                requestAnimationFrame(() => {
                  inputRef.current?.focus()
                })
              }
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
            ref={inputRef}
            onInput={e => {
              setQuery(e.currentTarget.value)
            }}
            onKeyDown={e => {
              if (e.currentTarget.value === '' && e.key === 'Backspace') {
                lastCourseRef.current?.focus()
              }
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

type CourseCodeNode = {
  course: CourseCode
  selected: boolean
}
type CourseCodeLink = {
  source: CourseCode
  target: CourseCode
}
type CourseNode = d3.SimulationNodeDatum & CourseCodeNode
type CourseLink = d3.SimulationLinkDatum<CourseNode>
type DragEvent = d3.D3DragEvent<SVGCircleElement, unknown, CourseNode>
type NodeUpdater = (nodes: CourseCodeNode[], links: CourseCodeLink[]) => void

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/force-directed-graph
 * Updating nodes: https://observablehq.com/@d3/build-your-own-graph
 */
function createGraph (wrapper: ParentNode): {
  update: NodeUpdater
  destroy: () => void
} {
  let nodes: CourseNode[] = []
  let links: CourseLink[] = []

  const color = d3.scaleOrdinal<string, string>([], d3.schemeTableau10)

  const svg = d3.create('svg').attr('class', 'svg')
  const legendSvg = d3.create('svg').attr('class', 'svg')
  const resize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
    legendSvg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, -height, width, height].join(' '))
  }
  resize()
  // http://thenewcode.com/1068/Making-Arrows-in-SVG
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('refX', 5 + 5 / 2 + 1.5 / 2)
    .attr('refY', 2.5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0.5 0.5 L 4.5 2.5 L 0.5 4.5')
    .attr('class', 'line')
  // Links first so the nodes are on top
  let link = svg
    .append('g')
    .style('cx', 0)
    .style('cy', 0)
    .selectAll<SVGLineElement, CourseLink>('line')
  let node = svg.append('g').selectAll<SVGCircleElement, CourseNode>('circle')
  let legendNode = legendSvg.append('g').selectAll<SVGGElement, CourseCode>('g')

  const tooltip = svg
    .append('g')
    .attr('class', 'tooltip')
    .attr('display', 'none')
  const tooltipCourse = tooltip
    .append('text')
    .attr('class', 'text tooltip-text')
    .attr('x', 10)
    .attr('y', 0)
  let tooltipNode: CourseNode | null = null
  tooltip.append('circle').attr('class', 'tooltip-circle')

  const simulation = d3
    .forceSimulation<CourseNode>([])
    .force(
      'link',
      d3.forceLink<CourseNode, CourseLink>([]).id(({ course }) => course)
    )
    .force('charge', d3.forceManyBody())
    // https://observablehq.com/@d3/temporal-force-directed-graph
    .force('x', d3.forceX())
    .force('y', d3.forceY())
    .on('tick', () => {
      node.attr('transform', d => `translate(${d.x}, ${d.y})`)
      link
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x! : null))
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y! : null))
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x! : null))
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y! : null))
      if (tooltipNode) {
        tooltip.attr(
          'transform',
          `translate(${tooltipNode.x}, ${tooltipNode.y})`
        )
      }
    })

  let dragging = false
  const drag = d3
    .drag<SVGCircleElement, CourseNode>()
    .on('start', (event: DragEvent) => {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
      dragging = true
    })
    .on('drag', (event: DragEvent) => {
      event.subject.fx = event.x
      event.subject.fy = event.y
    })
    .on('end', (event: DragEvent) => {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
      dragging = false
    })

  const update = (newNodes: CourseCodeNode[], newLinks: CourseCodeLink[]) => {
    const nodeMap: Record<CourseCode, CourseNode> = {}
    for (const node of nodes) {
      nodeMap[node.course] = node
    }
    nodes = newNodes.map(course => {
      if (nodeMap[course.course]) {
        Object.assign(nodeMap[course.course], course)
      } else {
        nodeMap[course.course] = course
      }
      return nodeMap[course.course]
    })
    node = node
      .data(nodes, ({ course }) => course)
      .join(
        enter =>
          enter
            .append('circle')
            .attr('r', 0)
            .on('mouseover', function (_: MouseEvent, node: CourseNode) {
              if (dragging) {
                return
              }
              tooltipNode = node
              tooltipCourse.text(node.course)
              tooltip
                .attr('display', null)
                .attr(
                  'transform',
                  `translate(${tooltipNode.x}, ${tooltipNode.y})`
                )

              link.attr('opacity', d => (d.target === node ? 1 : 0.6))
            })
            .on('mouseout', function (_: MouseEvent) {
              if (dragging) {
                return
              }
              tooltipNode = null
              tooltip.attr('display', 'none')

              link.attr('opacity', 0.6)
            })
            .call(drag)
            .call(enter => enter.transition().attr('r', 5)),
        update => update,
        exit => exit.call(exit => exit.transition().remove().attr('r', 0))
      )
      .attr('fill', ({ course }) => color(course.split(' ')[0]))
      .attr('class', ({ selected }) => (selected ? 'node selected' : 'node'))

    links = newLinks.map(({ source, target }) => ({
      source: nodeMap[source],
      target: nodeMap[target]
    }))
    link = link.data(links).join(
      enter =>
        enter
          .append('line')
          .attr('class', 'line')
          .attr('opacity', 0.6)
          .attr('stroke-width', 0)
          .call(enter => enter.transition().attr('stroke-width', 1.5)),
      update => update,
      exit =>
        exit.call(exit => exit.transition().remove().attr('stroke-width', 0))
    )

    const subjects = [
      ...new Set(newNodes.map(course => course.course.split(' ')[0]))
    ].sort()
    legendNode = legendNode
      .data(subjects, subject => subject)
      .join(
        enter => {
          const node = enter
            .append('g')
            .attr('opacity', 0)
            .call(enter =>
              enter
                .append('circle')
                .attr('class', 'node')
                .attr('r', 5)
                .attr('cx', 10)
                .attr('cy', 0)
            )
            .call(enter =>
              enter
                .append('text')
                .attr('class', 'text')
                .attr('x', 20)
                .text(subject => subject)
            )
          return node
        },
        update => update,
        exit => exit.call(exit => exit.transition().remove().attr('opacity', 0))
      )
      .call(node =>
        node
          .transition()
          .attr('opacity', 1)
          .attr('fill', subject => color(subject))
          .attr(
            'transform',
            (_, i) => `translate(0, ${(subjects.length - i) * -20 + 5})`
          )
      )

    simulation.nodes(nodes)
    simulation.force<d3.ForceLink<CourseNode, CourseLink>>('link')?.links(links)
    simulation.alpha(1).restart()
  }

  self.addEventListener('resize', resize)
  wrapper.append(legendSvg.node()!)
  wrapper.append(svg.node()!)
  const destroy = () => {
    self.removeEventListener('resize', resize)
    legendSvg.remove()
    svg.remove()
    simulation.stop()
  }

  return { update, destroy }
}

type TreeProps = {
  prereqs: Prereqs
  courses: CourseCode[]
}
function Tree ({ prereqs, courses }: TreeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const updateRef = useRef<NodeUpdater>()

  useEffect(() => {
    if (!wrapperRef.current) {
      return
    }
    const { update, destroy } = createGraph(wrapperRef.current)
    updateRef.current = update
    return destroy
  }, [wrapperRef.current])

  useEffect(() => {
    if (!updateRef.current) {
      return
    }

    const taken = [...courses]
    const links: CourseCodeLink[] = []
    let newCourses: CourseCode[]
    do {
      newCourses = []
      for (const [courseCode, reqs] of Object.entries(prereqs)) {
        // Skip classes that are unlocked by default
        if (reqs.length === 0 || taken.includes(courseCode)) {
          continue
        }
        const linked: CourseCode[] = []
        let added = false
        for (const req of reqs) {
          for (const alt of req) {
            if (taken.includes(alt)) {
              if (!linked.includes(alt)) {
                links.push({ source: alt, target: courseCode })
                linked.push(alt)
              }
              if (!added) {
                newCourses.push(courseCode)
                added = true
              }
              break
            }
          }
        }
      }
      taken.push(...newCourses)
    } while (newCourses.length > 0)

    updateRef.current(
      taken.map(course => ({ course, selected: courses.includes(course) })),
      links
    )
  }, [updateRef.current, courses])

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
