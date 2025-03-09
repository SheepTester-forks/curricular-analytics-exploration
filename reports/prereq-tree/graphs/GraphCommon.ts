import * as d3 from 'd3'
import { CourseCode } from '../../util/Prereqs'

export abstract class GraphCommon {
  nodeColor: d3.ScaleOrdinal<string, string>

  svg = d3.create('svg').attr('class', 'svg')
  #observer: ResizeObserver = new ResizeObserver(
    ([
      {
        contentBoxSize: [size]
      }
    ]) => this.resize(size.inlineSize, size.blockSize)
  )

  #legend = this.svg.append('g')
  #legendNode = this.#legend.selectAll<SVGGElement, CourseCode>('g')
  #legendTitle = this.#legend
    .append('text')
    .attr('class', 'text legend-title')
    .text('Subjects')
    .attr('x', 5)
    .attr('y', -35)
  #legendCount = this.#legend
    .append('text')
    .attr('class', 'text')
    .attr('x', 5)
    .attr('y', -15)

  constructor (wrapper: Element, subjects: string[]) {
    this.nodeColor = d3.scaleOrdinal<string, string>(
      subjects,
      d3.schemeTableau10
    )

    this.#observer.observe(wrapper)
    wrapper.append(this.svg.node()!)
  }

  getViewBox (width: number, height: number): [number, number, number, number] {
    return [-width / 2, -height / 2, width, height]
  }

  resize (width: number, height: number) {
    this.svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', this.getViewBox(width, height).join(' '))
    this.#legend.attr('transform', `translate(${-width / 2}, ${height / 2})`)
  }

  abstract handleHighlightSubject (subject: string | null): void

  updateCourses (newCourses: CourseCode[]): void {
    const subjects = [
      ...new Set(newCourses.map(course => course.split(' ')[0]))
    ].sort()
    this.#legendNode = this.#legendNode
      .data(subjects, subject => subject)
      .join(
        enter =>
          enter
            .append('g')
            .attr('opacity', 0)
            .on('mouseover', (_: MouseEvent, subject: string) => {
              this.handleHighlightSubject(subject)
            })
            .on('mouseout', () => {
              this.handleHighlightSubject(null)
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
          .attr('fill', subject => this.nodeColor(subject))
          .attr(
            'transform',
            (_, i) => `translate(0, ${(subjects.length - i) * -20 - 15})`
          )
      )
    this.#legendTitle.transition().attr('y', subjects.length * -20 - 35)
    this.#legendCount.text(`${newCourses.length} total courses shown`)
  }

  destroy (): void {
    this.#observer.disconnect()
    this.svg.remove()
  }
}
