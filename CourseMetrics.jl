module CourseMetrics

include("Output.jl")
include("Utils.jl")

import CurricularAnalytics: centrality, complexity, Curriculum
import .Output: output, plans, termname
import .Utils: convert, writerow

open("./files/courses_fa12.csv", "w") do file
  writerow(file, [
    "Year",
    "Major",
    "Course",
    "Complexity",
    "Centrality",
  ])

  for year in 2015:2050
    if year ∉ keys(plans)
      break
    end
    for major in sort(collect(keys(plans[year])))
      degree_plans = output(year, major)
      curriculum = convert(
        Curriculum,
        degree_plans[first(
          college
          for college in ["TH", "WA", "SN", "MU", "FI", "RE", "SI"]
          if college ∈ keys(degree_plans) && !(college == "SN" && year < 2020)
        )]
      )
      for (i, course) in enumerate(curriculum.courses)
        if course.prefix == ""
          continue
        end

        writerow(file, [
          string(year), # Year
          major, # Major
          "$(course.prefix) $(course.num)", # Course
          string(complexity(curriculum, i)), # Complexity
          string(centrality(curriculum, i)), # Centrality
        ])
      end
    end
  end
end

end
