# `api.curricularanalytics.com` notes

Based on the [private repo](https://github.com/CurricularAnalytics/CA_API/) we got access to, these are the available routes:

- GET `/healthcheck` (alias: `/`):
- POST `/metrics` (alias: `/curriculum/metrics`)

  - Accepts `Curriculum` or `DegreePlan`

- POST `/create_degree_plan` (alias: `/degree_plan/create`)

  - Accepts `Curriculum` if `optimization_params` specified and optimization enabled, else `DegreePlan`

- POST `/create_student_record`
- POST `/curriculum/csv`

  - Accepts `Curriculum`

- POST `/simulation` (inactive)
- POST `/requirements/audit` (if optimization enabled)

```ts
type OptimizationParams = {
  terms: number
  termMinMaxCredits: {
    [key: string]: [unknown, { min: unknown; max: unknown }]
  }
  /** A list of course IDs in the corresponding curriculum. */
  completedCourses: { course: { id: number } }[]
  termRestrictedOnly: (
    | {
        type: 'single'
        course: { id: number }
        term: number
      }
    | {
        type: 'range'
        course: { id: number }
        lowerTerm: number
        upperTerm: number
      }
  )[]
  consecutivePairs: { courseOne: { id: number }; courseTwo: { id: number } }[]
  fallOnly: { id: number }[]
  springOnly: { id: number }[]
  synergisticPairs: { courseOne: { id: number }; courseTwo: { id: number } }[]
  toxicPairs: { courseOne: { id: number }; courseTwo: { id: number } }[]

  new_value
  term_count
  prior_courses
  min_cit
  max_cit
  fixed_terms
  term_range
  consecutive_terms
}
```

The presence of the `curriculum` key is used to determine whether the object is valid. `curriculum.courses` determines that it's a `Curriculum`, and `curriculum.curriculum_terms` determines that it's a `DegreePlan`. [json.jl](https://github.com/CurricularAnalytics/CA_API/blob/master/src/conversions/json.jl)

```ts
type Curriculum = {
  curriculum: {
    /** Curriculum name. Default: empty string. */
    name?: string
    courses: {
      name: string
      /** Default: 0. */
      credits?: number
      /** Default: empty string. */
      prefix?: string
      /** Default: empty string. */
      num?: string
      id: number
      requisites: {
        source_id: number
        target_id: number
        type:
          | 'prereq'
          | 'CurriculumPrerequisite'
          | 'coreq'
          | 'CurriculumCorequisite'
          | 'strict-coreq'
          | 'CurriculumStrictCorequisite'
      }[]

      // If not specified, these metadata are left as `nothing` in Julia
      nameSub?: string
      nameCanonical?: string
      annotation?: string
      metadata: Record<string, any>
    }[]
    /** Case insensitive. Default if not "quarter": semester. */
    system_type?: 'semester' | 'quarter'
    /** Default: empty string. */
    institution?: string
    /** Default: empty string. */
    cip?: string
    /** Default: empty string. */
    degree_type?: string
  }
}

type DegreePlan = {
  curriculum: {
    curriculum_terms: {
      /** Curriculum and degree plan name. Default: empty string. */
      name?: string
      curriculum_items: {
        name: string
        credits: number
        id: number

        curriculum_requisites: {
          source_id: number
          target_id: number
          type:
            | 'prereq'
            | 'CurriculumPrerequisite'
            | 'coreq'
            | 'CurriculumCorequisite'
            | 'strict-coreq'
            | 'CurriculumStrictCorequisite'
        }[]

        nameSub?: string
        nameCanonical?: string
        annotation?: string
        metadata: Record<string, any>
      }[]
    }[]

    /** Case insensitive. Default if not "quarter": semester. */
    system_type?: 'semester' | 'quarter'
  }
}
```
