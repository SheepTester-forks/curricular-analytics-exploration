"""
Lists what majors require each course. I might've done this already, I forgot.
"""

from parse import CourseCode, major_plans
from util import partition, sorted_dict


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
