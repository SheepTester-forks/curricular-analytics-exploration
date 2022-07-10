using CurricularAnalytics

colleges = ["RE", "MU", "TH", "WA", "FI", "SI", "SN"]

output = open("./files/metrics.csv", "w")
write(output, "Major,College,Number of GEs,Complexity,Max centrality,Max centrality course,Longest path\n")
flush(output)

for major in readdir("./files/output/")
  for college in colleges
    plan = nothing
    try
      plan = read_csv("./files/output/$major/$college.csv")
    catch error
      if error isa SystemError
        # Ignore if college degree plan doesn't exist
        continue
      else
        throw(error)
      end
    end
    # Convert to curriculum
    curriculum = Curriculum(plan.name, [course for term in plan.terms for course in term.courses])
    try
      basic_metrics(curriculum)
    catch error
      # BoundsError: attempt to access 0-element Vector{Vector{Course}} at index [1]
      # For curricula like AN26 with no prerequisites, presumably
      if !(error isa BoundsError)
        throw(error)
      end
    end
    write(output, "$major,$college")
    try
      # UndefRefError: access to undefined reference
      # plan.additional_courses doesn't exist for PS33 MU
      write(output, ",$(length(plan.additional_courses))")
    catch error
      if !(error isa UndefRefError)
        throw(error)
      end
    end
    write(output, ",$(curriculum.metrics["complexity"][1])")
    write(output, ",$(curriculum.metrics["max. centrality"])")
    write(output, ",$(curriculum.metrics["max. centrality courses"][1].name)")
    write(output, isempty(curriculum.metrics["longest paths"]) ? "," : ",$(length(curriculum.metrics["longest paths"][1]))")
    write(output, "\n")
    flush(output)
  end
end

close(output)
