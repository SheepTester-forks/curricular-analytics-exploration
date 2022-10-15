"""
python3 college_ges.py > college_ges.csv
python3 college_ges.py json > reports/output/college_ges.json
"""

import sys
from college_names import college_codes, college_names
from parse import major_plans

json = sys.argv[1] == "json"

if json:
    print("{")
else:
    print("Major," + ",".join(college_names[college] for college in college_codes))

for major_code, plans in major_plans(2022).items():
    if major_code.startswith("UN"):
        continue
    if json:
        print(f'"{major_code}": [')
    else:
        print(major_code, end="")
    for college in college_codes:
        if college not in plans.colleges:
            if json:
                print("null,")
            else:
                print(",", end="")
            continue
        extra_ge_units = sum(
            course.units
            for course in plans.plan(college)
            if course.course_title.upper() != "ELECTIVE" and not course.for_major
        )
        if json:
            print(f"{extra_ge_units},")
        else:
            print(f",{extra_ge_units}", end="")
    if json:
        print(f"null],")
    else:
        print()

if json:
    print('"":[]}')
