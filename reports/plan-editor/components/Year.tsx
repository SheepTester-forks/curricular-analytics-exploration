/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import type { JSX } from 'preact/jsx-runtime'
import { YearPlan } from '../types.ts'
import { Term } from './Term.tsx'

const termNames = ['Fall', 'Winter', 'Spring']
export type YearProps = {
  planStartYear: string
  index: number
  plan: YearPlan
  onPlan: (plan: YearPlan) => void
  onYear?: ((year: string) => void) | null
  onDrag?: (
    event: JSX.TargetedPointerEvent<HTMLElement>,
    term: number,
    course: number
  ) => void
  onDropLocation?: (term: number, index: number | null) => void
  onRemove: () => void
}
export function Year ({
  planStartYear,
  index,
  plan,
  onPlan,
  onYear,
  onDrag,
  onDropLocation,
  onRemove
}: YearProps) {
  const empty = plan.every(term => term.length === 0)
  return (
    <section class='year-editor'>
      <h2 class='heading year-heading'>
        <strong>Year {index + 1}</strong>:{' '}
        {onYear ? (
          <input
            class='start-year'
            type='text'
            inputMode='numeric'
            pattern='[0-9]*'
            aria-label='Starting year'
            value={planStartYear}
            onInput={e => {
              onYear(e.currentTarget.value)
            }}
            onChange={e => {
              onYear(
                Number.isFinite(+e.currentTarget.value)
                  ? String(Math.trunc(+e.currentTarget.value))
                  : String(new Date().getFullYear())
              )
            }}
          />
        ) : (
          +planStartYear + index
        )}
        –{+planStartYear + index + 1}
        {empty && (
          <button class='remove-year' onClick={onRemove}>
            Remove
          </button>
        )}
        <span class='total-units'>
          Annual units:{' '}
          <span class='units'>
            {plan.reduce(
              (cum, curr) =>
                cum + curr.reduce((cum, curr) => cum + +curr.units, 0),
              0
            )}
          </span>
        </span>
      </h2>
      <div class='terms'>
        {plan.map((term, i) => (
          <Term
            name={termNames[i]}
            plan={term}
            onPlan={newPlan =>
              onPlan(plan.map((term, index) => (index === i ? newPlan : term)))
            }
            onDrag={(e, course) => onDrag?.(e, i, course)}
            onDropLocation={index => onDropLocation?.(i, index)}
            key={i}
          />
        ))}
      </div>
    </section>
  )
}
