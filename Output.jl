module Output

include("Parse.jl")

import CurricularAnalytics: Course, Curriculum, DegreePlan, pre, Requisite, Term
import .Parse: CourseCode, get_plans, get_prereqs

plans = get_plans()
prereqs = get_prereqs()

const non_course_prereqs = Dict{String,Vector{CourseCode}}(
  "SOCI- UD METHODOLOGY" => [("SOCI", "60")],
  "TDHD XXX" => [("TDTR", "10")],
)

# Mapping academic plan terms to prereq terms (assuming S1 for SU)
const quarter_names = ["FA", "WI", "SP", "S1"]

function termname(start_year::Int, term_idx::Int)
  quarter = quarter_names[mod1(term_idx, 4)]
  quarter * string(if quarter == "FA"
      # Starts at FA21 for 2021 + 0 years
      start_year % 100 + fld(term_idx - 1, 4)
    else
      # Starts at WI22 for 2021 + 0 years
      start_year % 100 + fld(term_idx - 1, 4) + 1
    end, pad=2)
end

function output(year::Int, major::AbstractString)
  academic_plans = plans[year][major]
  degree_plans = Dict{String,DegreePlan}()

  non_courses = Dict(key => Course[] for key in keys(non_course_prereqs))

  # College codes from least to most weird colleges (see #14) to make a
  # curriculum from the first college
  for college_code in ["TH", "WA", "SN", "MU", "FI", "RE", "SI"]
    if !(college_code in keys(academic_plans))
      continue
    end

    # Cache of identifiable courses
    courses = Dict{CourseCode,Course}()

    # This creates `Course`s for non-courses. Note that courses with the same
    # title aren't shared across degree plans. That's too complicated
    terms = [Term([
      if course.code !== nothing
        courses[course.code] = Course(course.raw_title, course.units, institution=if course.for_major
            "DEPARTMENT"
          else
            "COLLEGE"
          end, canonical_name=termname(year, i))
      else
        ca_course = Course(course.raw_title, course.units)
        if course.raw_title in keys(non_courses)
          push!(non_courses[course.raw_title], ca_course)
        end
        ca_course
      end for course in term
    ]) for (i, term) in enumerate(academic_plans[college_code])]

    # Add prereqs
    for (course_code, course) in courses
      if course_code in keys(prereqs)
        for requirement in prereqs[course_code]
          for option in requirement
            if option in keys(courses)
              add_requisite!(courses[option], course, pre)
              break
            end
          end
        end
      end
    end
    for (key, courses) in non_courses
      for prereq in non_course_prereqs[key]
        if prereq in keys(courses)
          for course in courses
            add_requisite!(courses[prereq], course, pre)
          end
        end
      end
    end

    degree_plans[college_code] = DegreePlan(
      college_code,
      Curriculum(major, Course[]),
      terms,
      Course[]
    )
  end

  degree_plans
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
