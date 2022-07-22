module Output

include("parse.jl")

import CurricularAnalytics: Course, Curriculum, DegreePlan, Term
import .Parse: CourseCode, get_plans

plans = get_plans()

struct DegreePlans
  curriculum::Curriculum
  degree_plans::Dict{String,DegreePlan}
end

function output(year::Int, major::AbstractString)
  academic_plans = plans[year][major]
  degree_plans = Dict{String,DegreePlan}()

  # Cache of identifiable courses
  courses = Dict{CourseCode,Course}()

  curriculum = nothing

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
        Course(course.raw_title, course.units)
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

  DegreePlans(curriculum, degree_plans)
end

print(output(2021, "CS26"))

end
