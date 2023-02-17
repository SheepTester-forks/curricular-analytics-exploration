/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { BeforeAfter } from '../types.ts'

export type ChangeProps<T> = {
  change: BeforeAfter<T>
  map?: (value: T) => string
}
export function Change<T> ({
  change: [before, after],
  map = String
}: ChangeProps<T>) {
  return (
    <span class='change'>
      {map(before)} <span class='arrow'>→</span> {map(after)}
    </span>
  )
}
