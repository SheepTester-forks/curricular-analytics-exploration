using CurricularAnalytics

for major in readdir("files/output/", join=true)
  println(major)
  for college in readdir(major, join=true)
    if endswith(college, "curriculum.csv")
      continue
    end
    println(college)
    plan::DegreePlan = read_csv(college)
    # Convert to curriculum
    curriculum = Curriculum(plan.name, [course for term in plan.terms for course in term.courses])
    try
      basic_metrics(curriculum)
    catch error
      if !(error isa BoundsError)
        throw(error)
      end
    end
    println(curriculum.metrics)
    break
  end
  break
end
