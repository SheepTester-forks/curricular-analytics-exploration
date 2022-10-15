"""
python3 college_ges.py > college_ges.csv
"""

import sys
from college_names import college_codes, college_names
from parse import major_codes, major_plans

html = sys.argv[1] == "html"

if html:
    college_headers = "".join(
        f'<th class="college-header">{college_names[college]}</th>'
        for college in college_codes
    )
    print(f'<table><tr><th class="major">Major</th>{college_headers}</tr>')
else:
    print("Major," + ",".join(college_names[college] for college in college_codes))

for major_code, plans in major_plans(2022).items():
    if major_code.startswith("UN"):
        continue
    if html:
        print('<tr><th scope="col" class="major">')
        print(
            f'<span class="major-code">{major_code}</span><span class="major-name">: {major_codes()[major_code].name}</span></th>'
        )
    else:
        print(major_code, end="")
    for college in college_codes:
        if college not in plans.colleges:
            if html:
                print("<td></td>")
            else:
                print(",", end="")
            continue
        extra_ge_units = sum(
            course.units
            for course in plans.plan(college)
            if course.course_title.upper() != "ELECTIVE" and not course.for_major
        )
        if html:
            print(f"<td>{extra_ge_units}</td>")
        else:
            print(f",{extra_ge_units}", end="")
    if html:
        print(f"</tr>")
    else:
        print()

if html:
    print("</table>")
