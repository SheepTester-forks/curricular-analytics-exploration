module CourseOverlap

include("Parse.jl")
include("Utils.jl")

import .Parse: get_plans
import .Utils: writerow

plans = get_plans()

open("./files/course_overlap.csv", "w") do file
  writerow(file, [
    "Year",
    "Base major",
    "Other major",
    "Percent of base major's courses in other major",
  ])

  for year in 2015:2050
    if year ∉ keys(plans)
      break
    end
    curricula = Dict(
      major => Set([
        course
        for term in degree_plans[first(
          college
          for college in ["TH", "WA", "SN", "MU", "FI", "RE", "SI", "EI"]
          if college ∈ keys(degree_plans) && !(college == "SN" && year < 2020)
        )]
        for course in term
        if course.for_major
      ])
      for (major, degree_plans) in plans[year]
    )
    majors = sort(collect(keys(curricula)))
    for base in majors
      for other in majors
        writerow(file, [
          string(year),
          base,
          other,
          string(length(curricula[base] ∩ curricula[other]) / length(curricula[base]))
        ])
      end
    end
  end
end

end
