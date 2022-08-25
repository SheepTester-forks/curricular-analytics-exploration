module PlanChanges

include("Output.jl")
include("Utils.jl")

import CurricularAnalytics: complexity, Curriculum, DegreePlan
import .Output: colleges, output, plans, termname
import .Utils: convert, writerow

majors = Set([
  major
  for year in 2015:2050
      if year ∈ keys(plans)
  for major in sort(collect(keys(plans[year])))
])

open("./files/changes.csv", "w") do file
  writerow(file, [
    "Major",
    "College",
    "Largest unit change",
    "Largest complexity change",
    "Number of unit changes",
  ])

  for major in majors
    degree_plans = Dict{Int,Dict{String,DegreePlan}}()
    for college in colleges
      largest_unit_change = 0
      largest_complexity_change = 0
      previous_units = nothing
      previous_complexity = nothing
      changes = 0
      for year in 2015:2050
        if year ∉ keys(plans) || major ∉ keys(plans[year]) || college == "SN" && year < 2020
          continue
        end
        if year ∉ keys(degree_plans)
          degree_plans[year] = output(year, major)
        end
        if college ∉ keys(degree_plans[year])
          continue
        end
        plan = degree_plans[year][college]
        curriculum = convert(Curriculum, plan)
        units = plan.credit_hours
        complex = complexity(curriculum)[1]
        if previous_units !== nothing
          if abs(units - previous_units) > largest_unit_change
            largest_unit_change = abs(units - previous_units)
          end
          if abs(complex - previous_complexity) > largest_complexity_change
            largest_complexity_change = abs(complex - previous_complexity)
          end
          if units != previous_units
            changes += 1
          end
        end
        previous_units = units
        previous_complexity = complex
      end
      writerow(file, [
        major,
        college,
        "$largest_unit_change",
        "$largest_complexity_change",
        "$changes",
      ])
    end
  end
end

end
