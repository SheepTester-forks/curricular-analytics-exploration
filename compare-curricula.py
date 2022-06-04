import itertools
import re
from parse import major_plans

colleges = ["RE", "MU", "TH", "WA", "FI", "SI", "SN"]
ignored = ["GE/DEI", "DEI/GE", "DEI"]

oddity_scores = {college: 0 for college in colleges}
deviation_scores = {college: 0 for college in colleges}
for major_plan in major_plans.values():
    try:
        curricula = {
            college: {
                re.sub(
                    r"( ?/ ?(awp|dei|sixth practicum)| \(dei approved\)|\*\* ?/elective)$",
                    "",
                    course.course_code.strip(" *^").lower(),
                )
                for course in major_plan.curriculum(college)
                if course.course_code not in ignored
            }
            for college in colleges
        }
    except KeyError as e:
        print(f"= <!> Error for {major_plan.major_code} =")
        print(f"Missing academic plan for {e.args[0]} (and possibly others too)")
        print()
        continue

    local_scores = {college: 0 for college in colleges}
    header_printed = False
    for (clg1, curr1), (clg2, curr2) in itertools.combinations(curricula.items(), 2):
        if curr1 != curr2:
            if not header_printed:
                print(f"= Discrepancies for {major_plan.major_code} =")
                header_printed = True
            print(f"== {clg1} vs {clg2} ==")
            print(f"[{clg1}] {curr1 - curr2}")
            print(f"[{clg2}] {curr2 - curr1}")
            local_scores[clg1] += 1
            local_scores[clg2] += 1
            oddity_scores[clg1] += 1
            oddity_scores[clg2] += 1
    if header_printed:
        unique = [
            college
            for college, score in local_scores.items()
            if score == len(colleges) - 1
        ]
        if len(unique) > 0:
            print(f"Deviations: {unique}")
            for college in unique:
                deviation_scores[college] += 1
        print()

print(f"College oddity scores: {oddity_scores}")
print(f"College deviation scores: {deviation_scores}")
