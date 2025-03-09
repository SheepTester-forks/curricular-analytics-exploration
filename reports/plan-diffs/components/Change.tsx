import { BeforeAfter } from '../types'

export type ChangeProps<T> = {
  change: BeforeAfter<T>
  map?: (value: T) => string
}
export function Change<T> ({
  change: [before, after],
  map = String
}: ChangeProps<T>) {
  return (
    <span className='change'>
      {map(before)} <span className='arrow'>→</span> {map(after)}
    </span>
  )
}
