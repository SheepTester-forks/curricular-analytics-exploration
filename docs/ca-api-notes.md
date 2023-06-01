# `api.curricularanalytics.com` notes

Based on the [private repo](https://github.com/CurricularAnalytics/CA_API/) we got access to, these are the available routes:

- GET `/healthcheck` (alias: `/`)

  - Returns `"Healthy"`

- POST `/metrics` (alias: `/curriculum/metrics`)

  - Accepts `Curriculum` or `DegreePlan`

  - Returns the same object with the `metrics` object populated (see below). Calculates the following metrics:

    - Blocking factor
    - Delay factor
    - Complexity
    - Centrality

- POST `/create_degree_plan` (alias: `/degree_plan/create`)

  - Accepts a `Curriculum`

    - Accepts `DegreePlan` if `optimization_params` specified and optimization enabled

  - Creates a `DegreePlan` from `Curriculum` with the `metrics` object populated (see below). Calculates the following metrics:

    - Blocking factor
    - Delay factor
    - Complexity
    - Centrality

- POST `/create_student_record`

- POST `/curriculum/csv`

  - Accepts `Curriculum` with `metrics` (otherwise the endpoint will crash)

  - Returns the CSV, named `[curriculum name].csv`

  - There's also a `create_degree_plan_csv` function in the codebase, but it isn't used

- POST `/simulation` (inactive)

- POST `/requirements/audit` (if optimization enabled)

To convert a `Curriculum` into a `DegreePlan`, it uses `bin_filling` from CurricularAnalytics to put courses into terms. I think it's for the curriculum view on the website.

## JSON to Julia

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

```ts
type Course = { id: number }
type CoursePair = { courseOne: Course; courseTwo: Course }
type OptimizationParams = {
  terms: number
  termMinMaxCredits: {
    [key: string]: [unknown, { min: unknown; max: unknown }]
  }
  /** A list of course IDs in the corresponding curriculum. */
  completedCourses: { course: Course }[]
  termRestrictedOnly: (
    | {
        type: 'single'
        course: Course
        term: number
      }
    | {
        type: 'range'
        course: Course
        lowerTerm: number
        upperTerm: number
      }
  )[]
  consecutivePairs: CoursePair[]
  fallOnly: Course[]
  springOnly: Course[]
  synergisticPairs: CoursePair[]
  toxicPairs: CoursePair[]

  // Created by the server
  // new_value
  // term_count
  // prior_courses
  // min_cit
  // max_cit
  // fixed_terms
  // term_range
  // consecutive_terms
}
```

## Julia to JSON

```ts
type DegreePlan = {
  curriculum: {
    name: string
    curriculum_terms: {
      /** 1-indexed. */
      id: number
      /** Number is same as `id`. */
      name: `Term ${number}`
      curriculum_items: {
        id: number
        name: string
        credits: number
        curriculum_requisites: {
          /** Course ID */
          source_id: number
          target_id: number
          type: 'prereq' | 'coreq' | 'strict-coreq'
        }[]
        metadata: Record<string, any>
        metrics: {
          'blocking factor'?: number
          'delay factor'?: number
          centrality?: number
          complexity?: number
          'requisite distance'?: number
        }
        nameSub?: string
        nameCanonical?: string
        annotation?: string
      }
    }[]
    metadata: Record<string, any>
    metrics?: {
      complexity: number
      centrality?: number
    }
  }
}
```

Converting a `Curriculum` object to JSON apparently is not finished, so it returns every field in the object.

```ts
/** https://github.com/JuliaGraphs/Graphs.jl/blob/a10ca671a209011f268d0770d36202dbae3029f7/src/SimpleGraphs/simpledigraph.jl#L9-L11 */
type SimpleDiGraph = {
  ne: number
  fadjlist: number[][]
  badjlist: number[][]
}
/** https://github.com/JuliaGraphs/MetaGraphs.jl/blob/c5aa8e2307f2f758d5e93e3e7cec4967d25d6414/src/MetaGraphs.jl#L49 */
type PropDict = Record<string, any>
/** https://github.com/JuliaGraphs/MetaGraphs.jl/blob/c5aa8e2307f2f758d5e93e3e7cec4967d25d6414/src/metadigraph.jl#L2-L9 */
type MetaDiGraph = {
  graph: SimpleDiGraph
  vprops: Record<number, PropDict>
  eprops: Record<`Edge ${number} => ${number}`, PropDict>
  gprops: PropDict
  weightfield: string
  defaultweight: number
  /** https://github.com/JuliaGraphs/MetaGraphs.jl/blob/c5aa8e2307f2f758d5e93e3e7cec4967d25d6414/src/MetaGraphs.jl#L50 */
  metaindex: Record<string, Record<any, number>>
  indices: string[]
}
type Course = {
  id: number
  vertex_id: Record<number, number>
  name: string
  credit_hours: number
  prefix: string
  num: string
  institution: string
  college: ''
  department: ''
  cross_listed: []
  canonical_name: ''
  requisites: Record<number, 'pre' | 'co' | 'strict_co'>
  metrics: t
  metadata: Record<string, any>
  passrate: 0.5
}
type Curriculum = {
  id: number
  name: string
  institution: string
  degree_type: string
  system_type: 'semester' | 'quarter'
  CIP: string
  courses: Course[]
  num_courses: number
  credit_hours: number
  graph: SimpleDiGraph
  learning_outcomes: []
  learning_outcome_graph: SimpleDiGraph
  course_learning_outcome_graph: MetaDiGraph
  metrics: {
    'blocking factor'?: [number, number[]]
    'delay factor'?: [number, number[]]
    centrality?: [number, number[]]
    complexity?: [number, number[]]
    'longest paths'?: Course[][]
    'max. blocking factor'?: number
    'max. blocking factor courses'?: Course[]
    'max. centrality'?: number
    'max. centrality courses'?: Course[]
    'max. delay factor'?: number
    'max. delay factor courses'?: Course[]
    'max. complexity'?: number
    'max. complexity courses'?: Course[]
    'dead end'?: Record<string, Course[]>
  }
  metadata: Record<string, any>
}
```
