"""
"Floating Calculus Requirement"

For every major, this one-off script lists lower-division courses that are not
prereqs for any identified course in the major. For now, this ignores elective
courses.

Another goal is to find majors where only one course depends on math. More
specifically, this script shows when exactly one upper-division course depends
on a math course.

$ python math20c.py 2024
"""

import sys

from parse import major_plans, prereqs
from parse_defs import CourseCode

if len(sys.argv) <= 1:
    raise ValueError("Need year: python math20c.py <year>")
year = int(sys.argv[1])

# Curricula have no term information, so default to the last term
all_prereqs = prereqs(f"SP{(year + 3) % 100:02d}")

for major_code, major in major_plans(year).items():
    courses = major.curriculum()
    ld_dependent_count: dict[CourseCode, list[CourseCode]] = {
        course.course_code: []
        for course in courses
        if course.course_code and course.course_code.parts()[1] < 100
    }
    for course in courses:
        if not course.course_code:
            continue
        for req in all_prereqs.get(course.course_code, []):
            for alt in req:
                if alt.course_code in ld_dependent_count:
                    ld_dependent_count[alt.course_code].append(course.course_code)
    no_dependents = sorted(
        course
        for course, dependents in ld_dependent_count.items()
        if len(dependents) == 0
    )
    one_dependent = sorted(
        (course, dependents[0])
        for course, dependents in ld_dependent_count.items()
        if len(dependents) == 1
    )
    if no_dependents:
        print(
            f"[{major_code}] Nothing requires {', '.join(str(code) for code in no_dependents)}."
        )
    for prereq, dependent in one_dependent:
        if dependent.parts()[1] >= 100 and prereq.subject == "MATH":
            print(f"[{major_code}] Only {dependent} requires {prereq}.")
