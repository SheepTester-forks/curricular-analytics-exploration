from typing import List
from parse import ParsedCourse, major_plans


def check_plan(name: str, plan: List[ParsedCourse]) -> None:
    course_codes = [course.course_code for course in plan if course.course_code]
    for i, code in enumerate(course_codes):
        if code in course_codes[0:i]:
            print(f"[{name}] duplicate course {code}")


for major_code, plans in major_plans(2022).items():
    for college_code in plans.colleges:
        check_plan(f"{major_code} {college_code}", plans.plan(college_code))
