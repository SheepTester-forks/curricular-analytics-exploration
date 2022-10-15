from college_names import college_codes, college_names
from parse import major_plans

print("Major," + ",".join(college_names[college] for college in college_codes))

for major_code, plans in major_plans(2022).items():
    if major_code.startswith("UN"):
        continue
    print(major_code, end="")
    for college in college_codes:
        if college not in plans.colleges:
            print(",", end="")
            continue
        extra_ge_units = sum(
            course.units
            for course in plans.plan(college)
            if course.course_title.upper() != "ELECTIVE" and not course.for_major
        )
        print(f",{extra_ge_units}", end="")
    print()
