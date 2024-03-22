/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import * as d3 from 'd3'
import { CourseCode } from '../../util/Prereqs.ts'
import { Vector2 } from '../../util/Vector2.ts'
import '../d3-hack.ts'
import { GraphCommon } from './GraphCommon.ts'
import { chunks } from '../../util/arrays.ts'

export type CourseCodeNode = {
  course: CourseCode
  selected: boolean
  dependents: CourseCode[]
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
export type CourseCodeLink = {
  source: CourseCode
  target: CourseCode
  required?: boolean
}
export type CourseNode = d3.SimulationNodeDatum & CourseCodeNode
export type CourseLink = d3.SimulationLinkDatum<CourseNode> & {
  required?: boolean
}
type DragEvent = d3.D3DragEvent<SVGCircleElement, unknown, CourseNode>
export type NodeUpdater = (
  nodes: CourseCodeNode[],
  links: CourseCodeLink[]
) => void

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/force-directed-graph
 * Updating nodes: https://observablehq.com/@d3/build-your-own-graph
 */
export class ForceDirectedGraph extends GraphCommon {
  #nodes: CourseNode[] = []
  #links: CourseLink[] = []

  // Links first so the nodes are on top
  #link = this.svg
    .append('g')
    .style('cx', 0)
    .style('cy', 0)
    .attr('class', 'line')
    .selectAll<SVGPathElement, CourseLink>('path')
  #node = this.svg.append('g').selectAll<SVGCircleElement, CourseNode>('circle')

  #tooltip = this.svg
    .append('g')
    .attr('class', 'tooltip')
    .attr('display', 'none')
  #tooltipCourse = this.#tooltip
    .append('text')
    .attr('class', 'text')
    .attr('x', 10)
    .attr('y', 0)
  #tooltipLine1 = this.#tooltip
    .append('text')
    .attr('class', 'text small')
    .attr('x', 10)
    .attr('y', 15)
  #tooltipLine2 = this.#tooltip
    .append('text')
    .attr('class', 'text small')
    .attr('x', 10)
    .attr('y', 30)
  #tooltipNode: CourseNode | null = null

  #simulation = d3
    .forceSimulation<CourseNode>([])
    .force(
      'link',
      d3.forceLink<CourseNode, CourseLink>([]).id(({ course }) => course)
    )
    .force('charge', d3.forceManyBody())
    // https://observablehq.com/@d3/temporal-force-directed-graph
    .force('x', d3.forceX())
    .force('y', d3.forceY())

  #dragging = false
  #drag = d3
    .drag<SVGCircleElement, CourseNode>()
    .on('start', (event: DragEvent) => {
      if (!event.active) this.#simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
      this.#dragging = true
    })
    .on('drag', (event: DragEvent) => {
      event.subject.fx = event.x
      event.subject.fy = event.y
    })
    .on('end', (event: DragEvent) => {
      if (!event.active) this.#simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
      this.#dragging = false
    })

  constructor (wrapper: Element, subjects: string[]) {
    super(wrapper, subjects)
    this.#tooltip.append('circle').attr('class', 'tooltip-circle')
  }

  resize (width: number, height: number) {
    super.resize(width, height)
    this.#simulation.on('tick', this.#onTick)
  }

  #onTick = () => {
    this.#node.attr('transform', d => `translate(${d.x}, ${d.y})`)
    this.#link.attr('d', d => {
      if (typeof d.source !== 'object' || typeof d.target !== 'object') {
        return null
      }
      const source = new Vector2(d.source)
      const target = new Vector2(d.target)
      const para = target.sub(source).normalized()
      const perp = new Vector2({ x: -para.y, y: para.x })
      return (
        `M${source} L${target} ` +
        `M${target.add(para.scaled(-11.75)).add(perp.scaled(-3))} L${target.add(
          para.scaled(-5.75)
        )} L${target.add(para.scaled(-11.75)).add(perp.scaled(3))}`
      )
    })
    if (this.#tooltipNode) {
      this.#tooltip.attr(
        'transform',
        `translate(${this.#tooltipNode.x}, ${this.#tooltipNode.y})`
      )
    }
  }

  handleHighlightSubject (subject: string | null): void {
    if (this.#dragging) {
      return
    }
    if (subject !== null) {
      this.#node.attr('opacity', ({ course }) =>
        course.split(' ')[0] === subject ? 1 : 0.1
      )
      this.#link.attr('opacity', 0.1)
    } else {
      this.#node.attr('opacity', null)
      this.#link.attr('opacity', null)
    }
  }

  update = (newNodes: CourseCodeNode[], newLinks: CourseCodeLink[]) => {
    this.updateCourses(newNodes.map(d => d.course))
    const nodeMap: Record<CourseCode, CourseNode> = {}
    for (const node of this.#nodes) {
      nodeMap[node.course] = node
    }
    this.#nodes = newNodes.map(course => {
      if (nodeMap[course.course]) {
        Object.assign(nodeMap[course.course], course)
      } else {
        nodeMap[course.course] = course
      }
      return nodeMap[course.course]
    })
    this.#node = this.#node
      .data(this.#nodes, ({ course }) => course)
      .join(
        enter =>
          enter
            .append('circle')
            .attr('r', 0)
            .on('mouseover', (_: MouseEvent, node: CourseNode) => {
              if (this.#dragging) {
                return
              }
              this.#tooltipNode = node
              this.#tooltipCourse.text(node.course)
              this.#tooltipLine1.text(
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
              this.#tooltipLine2.text(
                `Blocks ${node.dependents.length} course${
                  node.dependents.length === 0
                    ? 's'
                    : node.dependents.length === 1
                    ? ': '
                    : 's: '
                }${chunks(node.dependents, 5)
                  .map(line => line.join(', '))
                  .join(',\n')}`
              )
              this.#tooltip
                .attr('display', null)
                .attr(
                  'transform',
                  `translate(${this.#tooltipNode.x}, ${this.#tooltipNode.y})`
                )

              this.#link.attr('class', d =>
                d.target === node
                  ? d.required
                    ? 'line-selected'
                    : 'line-selected-grey'
                  : null
              )
            })
            .on('mouseout', () => {
              if (this.#dragging) {
                return
              }
              this.#tooltipNode = null
              this.#tooltip.attr('display', 'none')

              this.#link.attr('class', null)
            })
            .call(this.#drag)
            .call(enter => enter.transition().attr('r', 5)),
        update => update,
        exit => exit.call(exit => exit.transition().remove().attr('r', 0))
      )
      .attr('fill', ({ course }) => this.nodeColor(course.split(' ')[0]))
      .attr('class', ({ selected }) => (selected ? 'node selected' : 'node'))

    this.#links = newLinks.map(({ source, target, required }) => ({
      source: nodeMap[source],
      target: nodeMap[target],
      required
    }))
    this.#link = this.#link
      .data(this.#links)
      .join(
        enter => enter.append('path'),
        update => update,
        exit => exit.remove()
      )
      .attr('stroke', d => (d.required ? '#e15759' : null))

    this.#simulation.nodes(this.#nodes)
    this.#simulation
      .force<d3.ForceLink<CourseNode, CourseLink>>('link')
      ?.links(this.#links)
    this.#simulation.alpha(1).restart()
  }

  destroy (): void {
    super.destroy()
    this.#simulation.stop()
  }
}
