from typing import List
from parse import ParsedCourse, major_plans


def check_plan(name: str, plan: List[ParsedCourse]) -> None:
    course_codes = [course.course_code for course in plan if course.course_code]
    course_titles = {
        course.course_code: course.course_title for course in plan if course.course_code
    }
    for i, code in enumerate(course_codes):
        if code in course_codes[0:i]:
            title = course_titles[code]
            if any(char in title for char in ["/", "or", "OR"]):
                print(f"[{name}] multiple options for {code} {title}")
            else:
                print(f"[{name}] duplicate course {code} {title}")


for major_code, plans in major_plans(2022).items():
    for college_code in plans.colleges:
        check_plan(f"{major_code} {college_code}", plans.plan(college_code))
