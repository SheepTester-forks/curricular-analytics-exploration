export type Course = {
  title: string
  units: string
  requirement: {
    college: boolean
    major: boolean
  }
}
export type TermPlan = Course[]
export type YearPlan = TermPlan[]
export type AcademicPlan = {
  startYear: string
  type: '4-year' | 'transfer'
  years: YearPlan[]
  name: string
}
