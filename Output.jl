module Output

include("Parse.jl")

import CurricularAnalytics: Course, Curriculum, DegreePlan, Term
import .Parse: CourseCode, get_plans, get_prereqs

plans = get_plans()
prereqs = get_prereqs()

struct DegreePlans
  curriculum::Curriculum
  degree_plans::Dict{String,DegreePlan}
end

const non_course_prereqs = Dict{String,Vector{CourseCode}}(
  "SOCI- UD METHODOLOGY" => [("SOCI", "60")],
  "TDHD XXX" => [("TDTR", "10")],
)

function output(year::Int, major::AbstractString)
  academic_plans = plans[year][major]
  degree_plans = Dict{String,DegreePlan}()

  # Cache of identifiable courses
  courses = Dict{CourseCode,Course}()

  curriculum = nothing

  non_courses = Dict(key => Course[] for key in keys(non_course_prereqs))

  # College codes from least to most weird colleges (see #14) to make a
  # curriculum from the first college
  for college_code in ["TH", "WA", "SN", "MU", "FI", "RE", "SI"]
    if !(college_code in keys(academic_plans))
      continue
    end

    # Create `Course`s as needed
    for term in academic_plans[college_code]
      for plan_course in term
        if plan_course.code !== nothing
          get!(courses, plan_course.code) do
            Course(plan_course.raw_title, plan_course.units, canonical_name=if plan_course.for_major
              "DEPARTMENT"
            else
              "COLLEGE"
            end)
          end
        end
      end
    end

    # This creates `Course`s for non-courses. Note that courses with the same
    # title aren't shared across degree plans. That's too complicated
    terms = [Term([
      if course.code !== nothing
        courses[course.code]
      else
        ca_course = Course(course.raw_title, course.units)
        if course.raw_title in keys(non_courses)
          push!(non_courses[course.raw_title], ca_course)
        end
        ca_course
      end for course in term
    ]) for term in academic_plans[college_code]]

    if curriculum === nothing
      curriculum = Curriculum(major, [course for term in terms for course in term.courses if course.canonical_name == "DEPARTMENT"])
    end

    degree_plans[college_code] = DegreePlan(
      college_code,
      curriculum,
      terms,
      Course[course for term in terms for course in term.courses if course.canonical_name == "COLLEGE"]
    )
  end

  # Add prerequisites

  DegreePlans(curriculum, degree_plans)
end

function convert(::Type{Curriculum}, plan::DegreePlan)
  Curriculum(plan.name, [course for term in plan.terms for course in term.courses])
end

const Quarter = @NamedTuple{year::Int, quarter::Int}

struct PlanMetrics
  complexity::Float64
  units::Float32
  units_in_major::Float32
  units_not_in_major::Float32
  term_with_most_units::Quarter
  longest_path::Int
  percent_courses_with_prereqs::Float64
  under_180::Bool
  over_16_unit_per_term::Bool
  has_under_12_unit_term::Bool
  longest_path::Vector{String}
  max_complexity::Float64
  max_complexity_course::String
  max_centrality::Int
  max_centrality_course::String
  redundant_prereqs::Vector{String}
  max_unit_term::Tuple{Quarter,Float32}
end

end
