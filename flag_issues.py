"""
python3 units_per_course.py json > units_per_course.json
python3 flag_issues.py > files/flagged_issues.txt
"""

import json
from typing import Dict, List, Set
from parse import major_plans
from parse_defs import CourseCode, ProcessedCourse
from university import university

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

consensus_wrong = [
    CourseCode("JAPN", "130A"),
    CourseCode("JAPN", "130B"),
    CourseCode("JAPN", "130C"),
    CourseCode("JWSP", "1"),
    CourseCode("JWSP", "2"),
    CourseCode("JWSP", "3"),
]

with open("./units_per_course.json") as file:
    consensus_units: Dict[CourseCode, float] = {
        CourseCode(*course_code.split(" ")): units
        for course_code, units in json.load(file).items()
    }


class Issues:
    multiple_options: List[str] = []
    duplicate_courses: List[str] = []
    missing_ges: List[str] = []
    wrong_units: List[str] = []
    miscategorized_courses: List[str] = []
    curriculum_deviances: List[str] = []
    early_upper_division: List[str] = []


def check_plan(
    name: str, curriculum: Set[str], plan: List[ProcessedCourse], college: str
) -> None:
    course_codes = [course.course_code for course in plan if course.course_code]
    courses = {course.course_code: course for course in plan if course.course_code}
    for i, code in enumerate(course_codes):
        if code in course_codes[0:i]:
            title = courses[code].raw.course_title
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
                f"[{name}] missing {university.college_names[college]} GE {code}"
            )
        elif courses[code].raw.type != "COLLEGE":
            Issues.miscategorized_courses.append(
                f"[{name}] {code} is marked as a department course (it's a college GE)"
            )
    for course in plan:
        # Course title must match to exclude split lab courses
        if (
            course.units != course.raw.units
            and course.course_title == course.raw.course_title
        ):
            Issues.wrong_units.append(
                f"[{name}] “{course.course_title}” should be {course.units} units but is {course.raw.units} units"
            )
        elif (
            course.course_code in consensus_units
            and course.course_code not in consensus_wrong
            and consensus_units[course.course_code] != course.units
        ):
            Issues.wrong_units.append(
                f"[{name}] “{course.course_title}” should be {consensus_units[course.course_code]} units (by consensus) but is {course.units} units"
            )
        if course.course_title in curriculum:
            if not course.for_major:
                Issues.miscategorized_courses.append(
                    f"[{name}] Curriculum course “{course.course_title}” marked as GE"
                )
        else:
            if course.for_major:
                Issues.curriculum_deviances.append(
                    f"[{name}] “{course.course_title}” differs from curriculum"
                )
        if (
            course.term_index < 6
            and course.course_code
            and course.course_code.parts()[1] >= 100
        ):
            quarter = ["fall", "winter", "spring"][course.term_index % 3]
            Issues.early_upper_division.append(
                f"[{name}] “{course.course_title}” is taken in year {course.term_index // 3 + 1} {quarter} quarter"
            )


for major_code, plans in major_plans(year).items():
    curriculum = {course.course_title for course in plans.curriculum()}

    for college_code in plans.colleges:
        check_plan(
            f"{major_code} {college_code}",
            curriculum,
            plans.plan(college_code),
            college_code,
        )


def print_issues(issues: List[str], description: str) -> None:
    print(description)
    for issue in issues:
        print(issue)
    print()


print_issues(
    Issues.miscategorized_courses,
    "College GE courses marked as major/department courses",
)
print_issues(Issues.missing_ges, "Missing college GE")
print_issues(Issues.wrong_units, "Wrong unit numbers")
print_issues(Issues.duplicate_courses, "Duplicate courses")
print_issues(
    Issues.multiple_options, "Courses with multiple options listed multiple times"
)
print_issues(
    Issues.curriculum_deviances,
    "Course names marked as for the major not present in other colleges' curricula",
)
print_issues(
    Issues.early_upper_division,
    "Upper division courses taken before junior year",
)
