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
      if !(error isa BoundsError)
        throw(error)
      end
    end
    write(output, "$major,$college")
    write(output, ",$(length(plan.additional_courses))")
    write(output, ",$(curriculum.metrics["complexity"][1])")
    write(output, ",$(curriculum.metrics["max. centrality"])")
    write(output, ",$(curriculum.metrics["max. centrality courses"][1].name)")
    write(output, isempty(curriculum.metrics["longest paths"]) ? "," : ",$(length(curriculum.metrics["longest paths"][1]))")
    write(output, "\n")
    flush(output)
  end
  break
end

close(output)
