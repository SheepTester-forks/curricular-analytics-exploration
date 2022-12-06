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
          {courseCodes.map(code =>
            selected.includes(code) ? null : <option value={code} key={code} />
          )}
        </datalist>
      </li>
    </ul>
  )
}

type Options = {
  unlockedOnly: boolean
  forwards: boolean
  allAlts: boolean
}
type OptionsProps = { options: Options; onOptions: (options: Options) => void }
function Options ({ options, onOptions }: OptionsProps) {
  return (
    <div class='options'>
      <label class='option'>
        <input
          class='toggle-checkbox'
          type='checkbox'
          onChange={e =>
            onOptions({ ...options, forwards: e.currentTarget.checked })
          }
          checked={options.forwards}
        />{' '}
        <span class='toggle-shape'></span>
        Show unlocked courses
      </label>
      {options.forwards && (
        <label class='option'>
          <input
            class='toggle-checkbox'
            type='checkbox'
            onChange={e =>
              onOptions({ ...options, unlockedOnly: e.currentTarget.checked })
            }
            checked={options.unlockedOnly}
          />{' '}
          <span class='toggle-shape'></span>
          Only show fully unlocked courses
        </label>
      )}
      {!options.forwards && (
        <label class='option'>
          <input
            class='toggle-checkbox'
            type='checkbox'
            onChange={e =>
              onOptions({ ...options, allAlts: e.currentTarget.checked })
            }
            checked={options.allAlts}
          />{' '}
          <span class='toggle-shape'></span>
          Show all alternate prerequisites
        </label>
      )}
    </div>
  )
}

type CourseCodeNode = {
  course: CourseCode
  // If null, it's selected
  reqs: {
    satisfied: number
    total: number
  } | null
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
  const resize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
    legend.attr('transform', `translate(${-width / 2}, ${height / 2})`)
  }
  // http://thenewcode.com/1068/Making-Arrows-in-SVG
  const defs = svg.append('defs')
  for (const [id, className] of [
    ['arrowhead', 'line'],
    ['arrowhead-selected', 'line line-selected']
  ]) {
    defs
      .append('marker')
      .attr('id', id)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('refX', 5 + 5 / 2 + 1.5 / 2)
      .attr('refY', 2.5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0.5 0.5 L 4.5 2.5 L 0.5 4.5')
      .attr('class', className)
  }
  // Links first so the nodes are on top
  let link = svg
    .append('g')
    .style('cx', 0)
    .style('cy', 0)
    .selectAll<SVGLineElement, CourseLink>('line')
  let node = svg.append('g').selectAll<SVGCircleElement, CourseNode>('circle')
  const legend = svg.append('g')
  let legendNode = legend.selectAll<SVGGElement, CourseCode>('g')

  const tooltip = svg
    .append('g')
    .attr('class', 'tooltip')
    .attr('display', 'none')
  const tooltipCourse = tooltip
    .append('text')
    .attr('class', 'text')
    .attr('x', 10)
    .attr('y', 0)
  const tooltipReqs = tooltip
    .append('text')
    .attr('class', 'text small')
    .attr('x', 10)
    .attr('y', 15)
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
            .on('mouseover', (_: MouseEvent, node: CourseNode) => {
              if (dragging) {
                return
              }
              tooltipNode = node
              tooltipCourse.text(node.course)
              tooltipReqs.text(
                node.reqs
                  ? `${node.reqs.satisfied}/${node.reqs.total} prerequisite${
                      node.reqs.total === 1 ? '' : 's'
                    } satisfied`
                  : 'Already taken'
              )
              tooltip
                .attr('display', null)
                .attr(
                  'transform',
                  `translate(${tooltipNode.x}, ${tooltipNode.y})`
                )

              link.attr(
                'class',
                d =>
                  `line dep ${
                    d.target === node ? 'line-selected dep-selected' : ''
                  }`
              )
            })
            .on('mouseout', () => {
              if (dragging) {
                return
              }
              tooltipNode = null
              tooltip.attr('display', 'none')

              link.attr('class', 'line dep')
            })
            .call(drag)
            .call(enter => enter.transition().attr('r', 5)),
        update => update,
        exit => exit.call(exit => exit.transition().remove().attr('r', 0))
      )
      .attr('fill', ({ course }) => color(course.split(' ')[0]))
      .attr('class', ({ reqs }) => (reqs ? 'node' : 'node selected'))

    links = newLinks.map(({ source, target }) => ({
      source: nodeMap[source],
      target: nodeMap[target]
    }))
    link = link.data(links).join(
      enter => enter.append('line').attr('class', 'line dep'),
      update => update,
      exit => exit.remove()
    )

    const subjects = [
      ...new Set(newNodes.map(course => course.course.split(' ')[0]))
    ].sort()
    legendNode = legendNode
      .data(subjects, subject => subject)
      .join(
        enter =>
          enter
            .append('g')
            .attr('opacity', 0)
            .on('mouseover', (_: MouseEvent, subject: string) => {
              if (dragging) {
                return
              }
              node.attr('opacity', ({ course }) =>
                course.split(' ')[0] === subject ? 1 : 0.1
              )
              link.attr('opacity', 0.1)
            })
            .on('mouseout', () => {
              if (dragging) {
                return
              }
              node.attr('opacity', null)
              link.attr('opacity', null)
            })
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
            ),
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

  resize()
  self.addEventListener('resize', resize)
  wrapper.append(svg.node()!)
  const destroy = () => {
    self.removeEventListener('resize', resize)
    svg.remove()
    simulation.stop()
  }

  return { update, destroy }
}

type Graph = {
  nodes: CourseCodeNode[]
  links: CourseCodeLink[]
}
function getUnlockedCourses ({ prereqs, courses, options }: TreeProps): Graph {
  const allCourses: CourseCodeNode[] = courses.map(course => ({
    course,
    reqs: null
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
          reqs: { satisfied, total: reqs.length }
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
  const nodes: CourseCodeNode[] = courses.map(course => ({
    course,
    reqs: null
  }))
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
            nodes.push({ course: alt, reqs: { satisfied: 0, total: 0 } })
          }
          links.push({ source: alt, target: course })
        }
      }
    }
  } while (nextCourses.length > 0)
  return { nodes, links }
}

type TreeProps = {
  prereqs: Prereqs
  courses: CourseCode[]
  options: Options
}
function Tree (props: TreeProps) {
  const { courses, options } = props
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
    const { nodes, links } = options.forwards
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

type AppProps = {
  prereqs: Prereqs
}
function App ({ prereqs }: AppProps) {
  const [courses, setCourses] = useState<string[]>([])
  const [options, setOptions] = useState<Options>({
    unlockedOnly: false,
    forwards: true,
    allAlts: true
  })

  return (
    <>
      <CourseAdder
        courseCodes={Object.keys(prereqs)}
        selected={courses}
        onSelected={setCourses}
      />
      <Options options={options} onOptions={setOptions} />
      <Tree prereqs={prereqs} courses={courses} options={options} />
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
  />,
  document.getElementById('root')!
)
