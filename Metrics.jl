module Metrics

include("Output.jl")

import CurricularAnalytics: Curriculum, DegreePlan
import .Output: output, plans

function convert(::Type{Curriculum}, plan::DegreePlan)
  Curriculum(plan.name, [course for term in plan.terms for course in term.courses])
end

function writerow(io::IO, row::AbstractVector{String})
  join(io, [
      if ',' in field
        "\"$(replace(field, "\"" => "\"\""))\""
      else
        field
      end for field in row
    ], ",")
  write(io, "\n")
  flush(io)
end

open("./files/metrics_fa12.csv", "w") do file
  writerow(file, [
    "Year",
    "Major",
    "College",
    # Views
    "Complexity score",
    "Units #",
    "Units in major #",
    "Units not in major #",
    "Longest path #",
    "Longest path courses",
    "Highest complexity #",
    "Highest complexity name",
    "Highest centrality #",
    "Highest centrality name",
    "Highest term unit load",
    "Highest term unit load name",
    "% of courses with prerequisites",
    "% of units in major",
    # Flags
    "Under 180 units?",
    "Over 200 units?",
    "Has > 16-unit term?",
    "Has < 12-unit term?",
    "Has > 6 unit difference across colleges?",
  ])

  for year in 2021:2021
    for major in sort(collect(keys(plans[year])))
      degree_plans = output(year, major)
      for college in ["RE", "MU", "TH", "WA", "FI", "SI", "SN"]
        if !(college in keys(degree_plans))
          continue
        end

        plan = degree_plans[college]
        curriculum = convert(Curriculum, plan)
        try
          basic_metrics(curriculum)
        catch error
          # BoundsError: attempt to access 0-element Vector{Vector{Course}} at index [1]
          # For curricula like AN26 with no prerequisites, presumably
          if !(error isa BoundsError)
            throw(error)
          end
        end

        writerow(file, [
          string(year), # Year
          major, # Major
          college, # College
          # Views
          string(curriculum.metrics["complexity"][1]), # Complexity score
          string(plan.credit_hours), # Units #
          "", # Units in major #
          "", # Units not in major #
          string(if isempty(curriculum.metrics["longest paths"])
            0
          else
            length(curriculum.metrics["longest paths"][1])
          end), # Longest path #
          string(if isempty(curriculum.metrics["longest paths"])
            ""
          else
            join(curriculum.metrics["longest paths"][1], " → ")
          end), # Longest path courses
          string(curriculum.metrics["max. complexity"]), # Highest complexity #
          curriculum.metrics["max. complexity courses"][1].name, # Highest complexity name
          string(curriculum.metrics["max. centrality"]), # Highest centrality #
          curriculum.metrics["max. centrality courses"][1].name, # Highest centrality name
          "", # Highest term unit load
          "", # Highest term unit load name
          "", # % of courses with prerequisites
          "", # % of units in major
          # Flags
          string(plan.credit_hours < 180), # Under 180 units?
          string(plan.credit_hours > 200), # Over 200 units?
          "", # Has > 16-unit term?
          "", # Has < 12-unit term?
          "", # Has > 6 unit difference across colleges?
        ])
      end
    end
  end
end

end
