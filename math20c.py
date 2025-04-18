"""
"Floating Calculus Requirement"

For every major, this one-off script lists lower-division courses that are not
prereqs for any identified course in the major. For now, this ignores elective
courses.

$ python math20c.py 2024
"""

import sys

from parse import major_plans, prereqs

if len(sys.argv) <= 1:
    raise ValueError("Need year: python math20c.py <year>")
year = int(sys.argv[1])

# Curricula have no term information, so default to the last term
all_prereqs = prereqs(f"SP{(year + 3) % 100:02d}")

for major_code, major in major_plans(year).items():
    courses = major.curriculum()
    ld_courses = {
        course.course_code
        for course in courses
        if course.course_code and course.course_code.parts()[1] < 100
    }
    for course in courses:
        if not course.course_code:
            continue
        for req in all_prereqs.get(course.course_code, []):
            for alt in req:
                if alt.course_code in ld_courses:
                    ld_courses.remove(alt.course_code)
    if ld_courses:
        print(
            f"[{major_code}] Nothing requires {', '.join(str(code) for code in ld_courses)}."
        )
