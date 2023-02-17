/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import * as d3 from 'd3'
import { CourseCode } from '../util/Prereqs.ts'
import { Vector2 } from '../util/Vector2.ts'
import './d3-hack.ts'

export type CourseCodeNode = {
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
export function createGraph (
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
