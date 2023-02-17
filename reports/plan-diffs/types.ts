export type BeforeAfter<T> = [T, T]

export type Term = [number, string]

export type Change =
  | {
      type: 'removed' | 'added'
      course: string
      units: number
      term: Term
    }
  | {
      type: 'changed'
      course: string
      changes: {
        title?: BeforeAfter<string>
        units?: BeforeAfter<number>
        term?: BeforeAfter<Term>
        type?: BeforeAfter<'COLLEGE' | 'DEPARTMENT'>
        overlap?: BeforeAfter<boolean>
      }
    }

export type YearDiff = {
  changes: Change[]
  units?: BeforeAfter<number>
  year: number
  url: string
  complexity?: BeforeAfter<number>
}

export type PlanDiffs = {
  changes: YearDiff[]
  first: {
    year: number
    url: string
  }
}

export type Diffs = {
  [school: string]: {
    [department: string]: {
      [major: string]: {
        [college: string]: PlanDiffs
      }
    }
  }
}
