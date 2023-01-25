"""
python3 units_per_course.py json > units_per_course.json
python3 flag_issues.py > files/flagged_issues.html
"""

import json
from typing import Dict, List, Set
from parse import major_plans, prereqs
from parse_defs import CourseCode, ProcessedCourse
from university import university

YEAR = 2022

GES = {
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

CONSENSUS_WRONG = [
    CourseCode("JAPN", "130A"),
    CourseCode("JAPN", "130B"),
    CourseCode("JAPN", "130C"),
    CourseCode("JWSP", "1"),
    CourseCode("JWSP", "2"),
    CourseCode("JWSP", "3"),
]

ASSUMED_SATISFIED = [
    CourseCode("MATH", "10A"),
    CourseCode("MATH", "20A"),
    CourseCode("MCWP", "40"),
    CourseCode("MMW", "12"),
    CourseCode("CAT", "1"),
    CourseCode("SYN", "1"),
]

with open("./units_per_course.json") as file:
    consensus_units: Dict[CourseCode, float] = {
        CourseCode(*course_code.split(" ")): units
        for course_code, units in json.load(file).items()
    }


class Issues:
    multiple_options: List[str]
    duplicate_courses: List[str]
    missing_ges: List[str]
    wrong_units: List[str]
    miscategorized_courses: List[str]
    curriculum_deviances: List[str]
    early_upper_division: List[str]
    missing_prereqs: List[str]

    def __init__(self) -> None:
        self.multiple_options = []
        self.duplicate_courses = []
        self.missing_ges = []
        self.wrong_units = []
        self.miscategorized_courses = []
        self.curriculum_deviances = []
        self.early_upper_division = []
        self.missing_prereqs = []


def check_plan(
    name: str,
    curriculum: Set[str],
    plan: List[ProcessedCourse],
    college: str,
    issues: Issues,
) -> None:
    course_codes = [course.course_code for course in plan if course.course_code]
    courses = {course.course_code: course for course in plan if course.course_code}
    for i, code in enumerate(course_codes):
        if code in course_codes[0:i]:
            title = courses[code].raw.course_title
            if any(char in title for char in ["/", "or", "OR", "-"]):
                issues.multiple_options.append(
                    f"[{name}] multiple options for {code} “{title}”"
                )
            else:
                issues.duplicate_courses.append(
                    f"[{name}] duplicate course {code} “{title}”"
                )
    for code in GES[college]:
        if code not in course_codes:
            issues.missing_ges.append(
                f"[{name}] missing {university.college_names[college]} GE {code}"
            )
        elif courses[code].raw.type != "COLLEGE":
            issues.miscategorized_courses.append(
                f"[{name}] {code} is marked as a department course (it's a college GE)"
            )
    for course in plan:
        # Course title must match to exclude split lab courses
        if (
            course.units != course.raw.units
            and course.course_title == course.raw.course_title
        ):
            issues.wrong_units.append(
                f"[{name}] “{course.course_title}” should be {course.units} units but is {course.raw.units} units"
            )
        elif (
            course.course_code in consensus_units
            and course.course_code not in CONSENSUS_WRONG
            and consensus_units[course.course_code] != course.units
        ):
            issues.wrong_units.append(
                f"[{name}] “{course.course_title}” should be {consensus_units[course.course_code]} units (by consensus) but is {course.units} units"
            )
        if course.course_title in curriculum:
            if not course.for_major:
                issues.miscategorized_courses.append(
                    f"[{name}] Curriculum course “{course.course_title}” marked as GE"
                )
        else:
            if course.for_major:
                issues.curriculum_deviances.append(
                    f"[{name}] “{course.course_title}” differs from curriculum"
                )
        if (
            course.term_index < 6
            and course.course_code
            and course.course_code.parts()[1] >= 100
        ):
            quarter = ["fall", "winter", "spring"][course.term_index % 3]
            issues.early_upper_division.append(
                f"[{name}] “{course.course_title}” is taken in year {course.term_index // 3 + 1} {quarter} quarter"
            )
        if course.course_code and course.course_code not in ASSUMED_SATISFIED:
            reqs = prereqs(university.get_term_code(YEAR, course.term_index)).get(
                course.course_code
            )
            if reqs:
                taken = [
                    past_course.course_code
                    for past_course in plan
                    if past_course.course_code
                    and past_course.term_index < course.term_index
                ]
                taking = [
                    curr_course.course_code
                    for curr_course in plan
                    if curr_course.course_code
                    and curr_course.term_index == course.term_index
                ]
                for req in reqs:
                    if not req:
                        continue
                    for alt in req:
                        if (
                            alt.course_code in taken
                            or alt.allow_concurrent
                            and alt.course_code in taking
                        ):
                            break
                    else:
                        or_group = " or ".join(str(alt.course_code) for alt in req)
                        issues.missing_prereqs.append(
                            f"[{name}] “{course.course_title}” ({course.course_code}) is missing prereq {or_group}"
                        )


def print_issues(issues: List[str], description: str) -> None:
    if not issues:
        return
    print(f"<h2>{description}</h2>")
    for issue in issues:
        print(f"<p>{issue}</p>")
    print()


def main() -> None:
    for college_code, college_name in university.college_names.items():
        issues = Issues()
        for major_code, plans in major_plans(YEAR).items():
            if college_code not in plans.colleges:
                continue
            curriculum = {course.course_title for course in plans.curriculum()}
            check_plan(
                major_code,
                curriculum,
                plans.plan(college_code),
                college_code,
                issues,
            )

        print(f"<h1>{college_name}</h1>")
        print_issues(issues.duplicate_courses, "Duplicate courses")
        print_issues(
            issues.miscategorized_courses,
            "College GE courses marked as major/department courses",
        )
        print_issues(issues.missing_ges, "Missing college GE")
        print_issues(issues.wrong_units, "Wrong unit numbers")
        print_issues(issues.missing_prereqs, "Missing prerequisites")
        print_issues(
            issues.early_upper_division,
            "Upper division courses taken before junior year",
        )
        print_issues(
            issues.multiple_options,
            "Courses with multiple options listed multiple times",
        )
        print_issues(
            issues.curriculum_deviances,
            "Course names marked as for the major not present in other colleges' curricula",
        )


if __name__ == "__main__":
    print("<style>p { margin: 0; }</style>")
    main()
