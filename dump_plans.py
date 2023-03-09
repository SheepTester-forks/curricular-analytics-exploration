"""
python3 dump_plans.py 2022 json
python3 dump_plans.py 2022 html > reports/output/plan-editor-index.html
"""


import json
import sys
from typing import Dict, List, Optional
from urllib.parse import urlencode
from departments import departments, dept_schools
from parse import major_codes, major_plans
from parse_defs import ProcessedCourse
from university import university


def to_json(courses: List[ProcessedCourse]):
    return [
        (
            course.course_title,
            int(course.units) if course.units % 1 == 0 else course.units,
            3 if course.raw.overlaps_ge else 1 if course.for_major else 2,
            course.term_index,
        )
        for course in courses
    ]


def dump_plans(year: int) -> None:
    all_plans = major_plans(year)
    with open("./reports/output/plans.json", "w") as file:
        file.write(f"[{year}\n")
        for major_plan in all_plans.values():
            file.write(",[")
            major_info = major_codes()[major_plan.major_code]
            json.dump(
                [
                    major_info.department,
                    major_plan.major_code,
                    major_info.name,
                    major_info.cip_code,
                    list(major_info.award_types)[-1]
                    if major_info.award_types
                    else "BS",
                ],
                file,
                separators=(",", ":"),
            )
            for college_code in major_plan.colleges:
                file.write(f',["{college_code}",')
                json.dump(
                    to_json(major_plan.plan(college_code)),
                    file,
                    separators=(",", ":"),
                )
                file.write("]\n")
            file.write("]\n")
        file.write("]\n")


def render_plan_urls(year: int) -> None:
    all_plans = major_plans(year)
    qs_by_dept: Dict[str, Dict[str, Dict[str, Dict[str, Optional[str]]]]] = {}
    for major_code, major_plan in all_plans.items():
        major_info = major_codes()[major_code]
        department = departments[major_codes()[major_code].department]
        school = dept_schools.get(major_codes()[major_code].department) or ""
        if school not in qs_by_dept:
            qs_by_dept[school] = {}
        if department not in qs_by_dept[school]:
            qs_by_dept[school][department] = {}
        if major_code not in qs_by_dept[school][department]:
            qs_by_dept[school][department][major_code] = {}
        for college_code in university.college_codes:
            qs_by_dept[school][department][major_code][college_code] = (
                urlencode(
                    {
                        "year": year,
                        "department": major_info.department,
                        "major_name": major_info.name,
                        "major": major_plan.major_code,
                        "cipCode": major_info.cip_code,
                        "collegeCode": college_code,
                        "degreeType": list(major_info.award_types)[-1]
                        if major_info.award_types
                        else "BS",
                        "courses": json.dumps(
                            to_json(major_plan.plan(college_code)),
                            separators=(",", ":"),
                        ),
                    }
                )
                if college_code in major_plan.colleges
                else None
            )
    print("<table><tr><th>School</th><th>Department</th><th>Major</th>")
    for college_code in university.college_codes:
        print(f"<th>{university.college_names[college_code]}</th>")
    print("</tr>")
    for school, depts in sorted(qs_by_dept.items(), key=lambda entry: entry[0]):
        major_count = sum(len(majors) for majors in depts.values())
        print(f'<tr><th scole="col" rowspan="{major_count}">{school}</th>')
        for i, (department, majors) in enumerate(
            sorted(depts.items(), key=lambda entry: entry[0])
        ):
            if i > 0:
                print("<tr>")
            print(f'<th scole="col" rowspan="{len(majors)}">{department}</th>')
            for j, (major_code, colleges) in enumerate(
                sorted(majors.items(), key=lambda entry: entry[0])
            ):
                if j > 0:
                    print("<tr>")
                print(f"<td><strong>{major_code}</strong>", end="")
                major_name = major_codes()[major_code].name
                if major_name:
                    print(f": {major_name}")
                print("</td>")
                for college_code in university.college_codes:
                    if colleges[college_code] is None:
                        print("<td></td>")
                    else:
                        print(
                            f'<td><a href="./plan-editor?{colleges[college_code]}">Edit</a></td>'
                        )
                print("</tr>")
    print("</table>")


if __name__ == "__main__":
    if sys.argv[2] == "json":
        dump_plans(int(sys.argv[1]))
    elif sys.argv[2] == "html":
        render_plan_urls(int(sys.argv[1]))
