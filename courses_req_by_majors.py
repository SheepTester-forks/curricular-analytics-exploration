"""
Lists what majors require each course. I might've done this already, I forgot.

python3 courses_req_by_majors.py
python3 courses_req_by_majors.py json > courses_req_by_majors.json
"""

import json
from sys import stdout
from parse import major_plans
from parse_defs import CourseCode
from university import university
from util import partition, sorted_dict

MOST = 0.5
'Minimum percentage considered to be "most" colleges/majors (to allow for errors)'


def print_json() -> None:
    # TODO: partition by term
    majors = major_plans(2022)
    courses = partition(
        (
            course.course_code,
            (major_code, college) if course.for_major else (college, major_code),
        )
        for major_code, plans in majors.items()
        # Exclude undeclared majors
        if len(plans.colleges) >= len(university.college_codes) * MOST
        for college in plans.colleges
        for course in plans.plan(college)
        if course.course_code
    )
    courses = {
        str(course_code): {
            major: True
            if len(set(colleges))
            >= (
                len(majors)
                if major in university.college_codes
                else len(university.college_codes)
            )
            * MOST
            else sorted(
                colleges,
                key=lambda college: university.college_codes.index(college),
            )
            if major not in university.college_codes
            else colleges
            for major, colleges in partition(major_colleges).items()
        }
        for course_code, major_colleges in sorted_dict(courses, key=CourseCode.parts)
    }
    json.dump(
        {"_": {"college": university.college_names}, **courses},
        stdout,
    )


def print_readable() -> None:
    courses = partition(
        (course.course_code, major_code)
        for major_code, plans in major_plans(2022).items()
        for college in plans.colleges
        for course in plans.plan(college)
        if course.for_major and course.course_code
    )
    for course_code, major_codes in sorted_dict(courses, key=CourseCode.parts):
        majors = ", ".join(sorted(set(major_codes)))
        print(f"[{course_code}] {majors}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "json":
        print_json()
    else:
        print_readable()
