"""
python3 dump_plans.py 2022 json
python3 dump_plans.py 2022 html > reports/output/dump-plans.html
"""


import json
import sys
from typing import List
from urllib.parse import urlencode
from parse import major_codes, major_plans
from parse_defs import ProcessedCourse


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
    print("<dl>")
    for major_plan in all_plans.values():
        major_info = major_codes()[major_plan.major_code]
        print(f"<dt>{major_plan.major_code}: {major_info.name}</dt><dd>")
        for college_code in major_plan.colleges:
            print(f'<a href="./plan-editor.html?')
            print(
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
            )
            print(f'">{college_code}</a> ')
        print("</dd>")
    print("</dl>")


if __name__ == "__main__":
    if sys.argv[2] == "json":
        dump_plans(int(sys.argv[1]))
    elif sys.argv[2] == "html":
        render_plan_urls(int(sys.argv[1]))
