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
  years: YearPlan[]
  departmentCode: string
  majorName: string
  majorCode: string
  cipCode: string
  collegeCode: string
  collegeName: string
  degreeType: string
}
export type Metadata = Omit<AcademicPlan, 'years'>
