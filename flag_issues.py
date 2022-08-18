from typing import List
from parse import ParsedCourse, major_plans

year = 2022


class Issues:
    multiple_options: List[str] = []
    duplicate_courses: List[str] = []


def check_plan(name: str, plan: List[ParsedCourse]) -> None:
    course_codes = [course.course_code for course in plan if course.course_code]
    course_titles = {
        course.course_code: course.course_title_raw
        for course in plan
        if course.course_code
    }
    for i, code in enumerate(course_codes):
        if code in course_codes[0:i]:
            title = course_titles[code]
            if any(char in title for char in ["/", "or", "OR", "-"]):
                Issues.multiple_options.append(f"[{name}] {code} “{title}”")
            else:
                Issues.duplicate_courses.append(f"[{name}] {code} “{title}”")


for major_code, plans in major_plans(year).items():
    for college_code in plans.colleges:
        check_plan(f"{major_code} {college_code}", plans.plan(college_code))


def print_issues(issues: List[str], description: str) -> None:
    print(description)
    for issue in issues:
        print(issue)
    print()


print_issues(Issues.duplicate_courses, "Duplicate courses")
print_issues(Issues.multiple_options, "Courses with multiple options")
