"""
python3 orphans.py 2023
"""

from typing import Set
from curricularanalytics import AbstractCourse, Course, Curriculum
from output import MajorOutput
from parse import major_plans
from parse_defs import CourseCode


def get_orphans(curr: Curriculum) -> Set[AbstractCourse]:
    has_requisites: Set[int] = set()
    has_dependants: Set[int] = set()
    for course in curr.courses:
        if len(course.requisites) > 0:
            has_requisites.add(course.id)
            for req_id in course.requisites.keys():
                has_dependants.add(req_id)
    return {curr.course_from_id(id) for id in has_requisites - has_dependants}


def check_all_orphans(year: int):
    for major_code, plans in major_plans(year).items():
        output = MajorOutput(plans)
        dp = output.output_degree_plan()
        orphans = get_orphans(dp.curriculum)
        course_codes = sorted(
            CourseCode(course.prefix, course.num)
            for course in orphans
            if isinstance(course, Course)
        )
        ld_orphans = ", ".join(
            str(code) for code in course_codes if code.parts()[1] < 100
        )
        if ld_orphans:
            print(f"[{major_code}]: {ld_orphans}")


if __name__ == "__main__":
    import sys

    check_all_orphans(int(sys.argv[1]))
