"""
python3 dump_plans.py 2022
"""


import json
import sys
from parse import major_codes, major_plans


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
                    [
                        [
                            course.course_title,
                            int(course.units)
                            if course.units % 1 == 0
                            else course.units,
                            3
                            if course.raw.overlaps_ge
                            else 1
                            if course.for_major
                            else 2,
                        ]
                        for course in major_plan.plan(college_code)
                    ],
                    file,
                    separators=(",", ":"),
                )
                file.write("]\n")
            file.write("]\n")
        file.write("]\n")


if __name__ == "__main__":
    dump_plans(int(sys.argv[1]))
