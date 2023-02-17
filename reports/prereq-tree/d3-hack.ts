// HACK to allow Selection.transition()
export type { Selection } from 'types:d3-selection'
declare module 'types:d3-selection' {
  interface Selection<
    GElement extends d3.BaseType,
    Datum,
    PElement extends d3.BaseType,
    PDatum
  > {
    transition(name?: string): d3.Transition<GElement, Datum, PElement, PDatum>
  }
}
