/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import * as d3 from 'd3'
import { CourseCode } from '../../util/Prereqs.ts'
import { GraphCommon } from './GraphCommon.ts'

export type Prereq = {
  /** The prerequisite course. */
  course: CourseCode
  /** The course that the prereq satisfies. `null` if root. */
  parent: CourseCode | null
}

/**
 * Copyright 2021 Observable, Inc.
 * Released under the ISC license.
 * https://observablehq.com/@d3/tree
 */
export class TidyTree extends GraphCommon {
  constructor (wrapper: Element, subjects: string[]) {
    super(wrapper, subjects)
  }

  getViewBox (width: number, height: number): [number, number, number, number] {
    // return [(-dy * padding) / 2, x0 - dx, width, height]
    throw 'todo'
  }

  handleHighlightSubject (_subject: string | null): void {}

  update (data: Prereq[]) {
    const root = d3
      .stratify<Prereq>()
      .id(d => d.course)
      .parentId(d => d.parent)(data) as d3.HierarchyPointNode<Prereq>

    const width = 640 // TODO
    const padding = 1
    const dx = 10
    const dy = width / (root.height + padding)
    const tree = d3.tree<Prereq>().nodeSize([dx, dy])(root)
    let x0 = Infinity
    let x1 = -x0
    tree.each(d => {
      if (d.x > x1) x1 = d.x
      if (d.x < x0) x0 = d.x
    })
    this.svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(tree.links())
      .join('path')
      .attr(
        'd',
        d3
          .linkHorizontal<
            d3.HierarchyLink<Prereq>,
            d3.HierarchyPointNode<Prereq>
          >()
          .x(d => d.y)
          .y(d => d.x)
      )

    const node = this.svg
      .append('g')
      .selectAll('a')
      .data(root.descendants())
      .join('span')
      .attr('transform', d => `translate(${d.y},${d.x})`)

    node
      .append('circle')
      .attr('fill', d => (d.children ? '#555' : '#999'))
      .attr('r', 3)

    node.append('title').text(d => d.data.course)

    node
      .append('text')
      .attr('dy', '0.32em')
      .attr('x', d => (d.children ? -6 : 6))
      .attr('text-anchor', d => (d.children ? 'end' : 'start'))
      .attr('paint-order', 'stroke')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .text(d => d.data.course)
  }
}
