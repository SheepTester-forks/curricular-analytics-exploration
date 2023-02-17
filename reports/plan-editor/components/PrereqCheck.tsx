/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Fragment } from 'preact'
import { CourseCode } from '../../util/Prereqs.ts'

export const assumedSatisfied: CourseCode[] = ['MATH 4C', 'AWP 3', 'AWP 4B']
export type PrereqCheckProps = {
  code: CourseCode
  reqs: CourseCode[][]
  pastTerms: CourseCode[]
}
export function PrereqCheck ({ code, reqs, pastTerms }: PrereqCheckProps) {
  if (reqs.length === 0) {
    return (
      <p class='course-code-line'>
        {code} — <em class='no-prereqs'>No prerequisites</em>
      </p>
    )
  }
  const satisfied = reqs.every(
    req =>
      req.length === 0 ||
      req.some(alt => assumedSatisfied.includes(alt) || pastTerms.includes(alt))
  )
  return (
    <details class='course-code-item' open={!satisfied}>
      <summary class={`course-code ${satisfied ? '' : 'missing-prereq'}`}>
        {code}
      </summary>
      <ul class='reqs'>
        {reqs.map((req, i) => {
          if (req.length === 0) {
            return null
          }
          const satisfied = req.some(
            alt => assumedSatisfied.includes(alt) || pastTerms.includes(alt)
          )
          return (
            <li class={satisfied ? 'satisfied' : 'missing'} key={i}>
              {satisfied ? '✅' : '❌'}
              {req.map((alt, i) => (
                <Fragment key={i}>
                  {i !== 0 ? ' or ' : null}
                  {assumedSatisfied.includes(alt) ? (
                    <strong class='assumed' title='Assumed to be satisfied'>
                      {alt}*
                    </strong>
                  ) : pastTerms.includes(alt) ? (
                    <strong>{alt}</strong>
                  ) : (
                    alt
                  )}
                </Fragment>
              ))}
            </li>
          )
        })}
      </ul>
    </details>
  )
}
