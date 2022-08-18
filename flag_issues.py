from typing import List
from college_names import college_names
from parse import CourseCode, ParsedCourse, major_plans

year = 2022

ges = {
    "RE": [
        CourseCode("HUM", "1"),
        CourseCode("HUM", "2"),
        CourseCode("HUM", "3"),
        CourseCode("HUM", "4"),
        CourseCode("HUM", "5"),
    ],
    "MU": [
        CourseCode("MCWP", "40"),
        CourseCode("MCWP", "50"),
    ],
    "TH": [
        CourseCode("DOC", "1"),
        CourseCode("DOC", "2"),
        CourseCode("DOC", "3"),
    ],
    "WA": [
        CourseCode("WCWP", "10A"),
        CourseCode("WCWP", "10B"),
        CourseCode("POLI", "27"),
        CourseCode("POLI", "28"),
    ],
    "FI": [
        CourseCode("MMW", "11"),
        CourseCode("MMW", "12"),
        CourseCode("MMW", "13"),
        CourseCode("MMW", "14"),
        CourseCode("MMW", "15"),
    ],
    "SI": [
        CourseCode("CAT", "1"),
        CourseCode("CAT", "2"),
        CourseCode("CAT", "3"),
        CourseCode("CAT", "125"),
    ],
    "SN": [
        CourseCode("SYN", "1"),
        CourseCode("SYN", "2"),
        CourseCode("SYN", "100"),
    ],
}


class Issues:
    multiple_options: List[str] = []
    duplicate_courses: List[str] = []
    missing_ges: List[str] = []


def check_plan(name: str, plan: List[ParsedCourse], college: str) -> None:
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
                Issues.multiple_options.append(
                    f"[{name}] multiple options for {code} “{title}”"
                )
            else:
                Issues.duplicate_courses.append(
                    f"[{name}] duplicate course {code} “{title}”"
                )
    for code in ges[college]:
        if code not in course_codes:
            Issues.missing_ges.append(
                f"[{name}] missing {college_names[college]} GE {code}"
            )


for major_code, plans in major_plans(year).items():
    for college_code in plans.colleges:
        check_plan(
            f"{major_code} {college_code}", plans.plan(college_code), college_code
        )


def print_issues(issues: List[str], description: str) -> None:
    print(description)
    for issue in issues:
        print(issue)
    print()


print_issues(Issues.missing_ges, "Missing college GE")
print_issues(Issues.duplicate_courses, "Duplicate courses")
print_issues(
    Issues.multiple_options, "Courses with multiple options listed multiple times"
)
