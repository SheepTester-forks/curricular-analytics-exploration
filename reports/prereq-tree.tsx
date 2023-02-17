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

type IVector2 = { x: number; y: number }
class Vector2 {
  x: number
  y: number

  constructor ({ x = 0, y = 0 }: Partial<IVector2> = {}) {
    this.x = x
    this.y = y
  }

  add ({ x, y }: IVector2): Vector2 {
    return new Vector2({ x: this.x + x, y: this.y + y })
  }

  sub ({ x, y }: IVector2): Vector2 {
    return new Vector2({ x: this.x - x, y: this.y - y })
  }

  scaled (factor: number): Vector2 {
    return new Vector2({ x: this.x * factor, y: this.y * factor })
  }

  get length (): number {
    return Math.hypot(this.x, this.y)
  }

  normalized (): Vector2 {
    return this.scaled(1 / this.length)
  }

  toString (): string {
    return [this.x, this.y].join(' ')
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
  mode: 'blocked' | 'prereqs'
  unlockedOnly: boolean
  allAlts: boolean
}
type OptionsProps = {
  options: Options
  onOptions: (options: Partial<Options>) => void
}
function Options ({ options, onOptions }: OptionsProps) {
  return (
    <div class='controls'>
      {/* https://stackoverflow.com/a/45677146; <fieldset> can't be display: flex */}
      <div
        class='select-one-wrapper'
        role='radiogroup'
        aria-labelledby='mode-label'
      >
        <span class='select-one-label' id='mode-label'>
          Mode
        </span>
        <label class='select-button-wrapper'>
          <input
            class='select-radio'
            type='radio'
            name='mode'
            checked={options.mode === 'blocked'}
            onChange={() => onOptions({ mode: 'blocked' })}
          />
          <span class='select-button'>Blocked courses</span>
        </label>
        <label class='select-button-wrapper'>
          <input
            class='select-radio'
            type='radio'
            name='mode'
            checked={options.mode === 'prereqs'}
            onChange={() => onOptions({ mode: 'prereqs' })}
          />
          <span class='select-button'>Prerequisites</span>
        </label>
      </div>
      {options.mode === 'blocked' && (
        <label class='option'>
          <input
            class='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ unlockedOnly: e.currentTarget.checked })}
            checked={options.unlockedOnly}
          />{' '}
          <span class='toggle-shape'></span>
          Only show fully unlocked courses
        </label>
      )}
      {options.mode === 'prereqs' && (
        <label class='option' style={{ display: 'none' }}>
          <input
            class='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ allAlts: e.currentTarget.checked })}
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
  selected: boolean
  note:
    | {
        type: 'satisfied'
        satisfied: number
        total: number
      }
    | { type: 'taken' }
    | { type: 'reqs'; count: number }
    | { type: 'omitted-alts'; count: number }
    | null
}
type CourseCodeLink = {
  source: CourseCode
  target: CourseCode
  required?: boolean
}
type CourseNode = d3.SimulationNodeDatum & CourseCodeNode
type CourseLink = d3.SimulationLinkDatum<CourseNode> & {
  required?: boolean
}
type DragEvent = d3.D3DragEvent<SVGCircleElement, unknown, CourseNode>
type NodeUpdater = (nodes: CourseCodeNode[], links: CourseCodeLink[]) => void

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/force-directed-graph
 * Updating nodes: https://observablehq.com/@d3/build-your-own-graph
 */
function createGraph (
  wrapper: ParentNode,
  subjects: string[]
): {
  update: NodeUpdater
  destroy: () => void
} {
  let nodes: CourseNode[] = []
  let links: CourseLink[] = []

  const nodeColor = d3.scaleOrdinal<string, string>(
    subjects,
    d3.schemeTableau10
  )

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
  // Links first so the nodes are on top
  let link = svg
    .append('g')
    .style('cx', 0)
    .style('cy', 0)
    .attr('class', 'line')
    .selectAll<SVGPathElement, CourseLink>('path')
  let node = svg.append('g').selectAll<SVGCircleElement, CourseNode>('circle')
  const legend = svg.append('g')
  let legendNode = legend.selectAll<SVGGElement, CourseCode>('g')
  const legendTitle = legend
    .append('text')
    .attr('class', 'text legend-title')
    .text('Subjects')
    .attr('x', 5)
    .attr('y', -35)
  const legendCount = legend
    .append('text')
    .attr('class', 'text')
    .attr('x', 5)
    .attr('y', -15)

  const tooltip = svg
    .append('g')
    .attr('class', 'tooltip')
    .attr('display', 'none')
  const tooltipCourse = tooltip
    .append('text')
    .attr('class', 'text')
    .attr('x', 10)
    .attr('y', 0)
  const tooltipLine1 = tooltip
    .append('text')
    .attr('class', 'text small')
    .attr('x', 10)
    .attr('y', 15)
  const tooltipLine2 = tooltip
    .append('text')
    .attr('class', 'text small')
    .attr('x', 10)
    .attr('y', 30)
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
      link.attr('d', d => {
        if (typeof d.source !== 'object' || typeof d.target !== 'object') {
          return null
        }
        const source = new Vector2(d.source)
        const target = new Vector2(d.target)
        const para = target.sub(source).normalized()
        const perp = new Vector2({ x: -para.y, y: para.x })
        return (
          `M${source} L${target} ` +
          `M${target
            .add(para.scaled(-11.75))
            .add(perp.scaled(-3))} L${target.add(para.scaled(-5.75))} L${target
            .add(para.scaled(-11.75))
            .add(perp.scaled(3))}`
        )
      })
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
              tooltipLine1.text(
                node.note?.type === 'taken'
                  ? 'Added by you'
                  : node.note?.type === 'satisfied'
                  ? `${node.note.satisfied}/${node.note.total} prerequisite${
                      node.note.total === 1 ? '' : 's'
                    } shown`
                  : node.note?.type === 'reqs'
                  ? `Requires ${node.note.count} course${
                      node.note.count === 1 ? '' : 's'
                    }`
                  : node.note?.type === 'omitted-alts'
                  ? `${node.note.count} alternative${
                      node.note.count === 1 ? '' : 's'
                    } not shown`
                  : ''
              )
              // tooltipLine2.text(
              //   node.note?.type === 'satisfied' ? 'nth degree' : ''
              // )
              tooltip
                .attr('display', null)
                .attr(
                  'transform',
                  `translate(${tooltipNode.x}, ${tooltipNode.y})`
                )

              link.attr('class', d =>
                d.target === node
                  ? d.required
                    ? 'line-selected'
                    : 'line-selected-grey'
                  : null
              )
            })
            .on('mouseout', () => {
              if (dragging) {
                return
              }
              tooltipNode = null
              tooltip.attr('display', 'none')

              link.attr('class', null)
            })
            .call(drag)
            .call(enter => enter.transition().attr('r', 5)),
        update => update,
        exit => exit.call(exit => exit.transition().remove().attr('r', 0))
      )
      .attr('fill', ({ course }) => nodeColor(course.split(' ')[0]))
      .attr('class', ({ selected }) => (selected ? 'node selected' : 'node'))

    links = newLinks.map(({ source, target, required }) => ({
      source: nodeMap[source],
      target: nodeMap[target],
      required
    }))
    link = link
      .data(links)
      .join(
        enter => enter.append('path'),
        update => update,
        exit => exit.remove()
      )
      .attr('stroke', d => (d.required ? '#e15759' : null))

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
          .attr('fill', subject => nodeColor(subject))
          .attr(
            'transform',
            (_, i) => `translate(0, ${(subjects.length - i) * -20 - 15})`
          )
      )
    legendTitle.transition().attr('y', subjects.length * -20 - 35)
    legendCount.text(`${nodes.length} total courses shown`)

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

type TreeProps = {
  prereqs: Prereqs
  courses: CourseCode[]
  options: Options
}
function Tree (props: TreeProps) {
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

type AppProps = {
  prereqs: Prereqs
}
function App ({ prereqs }: AppProps) {
  const [courses, setCourses] = useState<string[]>([])
  const [options, setOptions] = useState<Options>({
    mode: 'blocked',
    unlockedOnly: false,
    allAlts: true
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

render(
  <App
    prereqs={
      JSON.parse(document.getElementById('prereqs')?.textContent ?? 'false') ||
      // deno-lint-ignore no-explicit-any
      (window as any)['PREREQS']
    }
  />,
  document.getElementById('root')!
)
