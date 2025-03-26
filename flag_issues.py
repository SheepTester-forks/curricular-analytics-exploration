"""
python3 units_per_course.py json > units_per_course.json
python3 flag_issues.py 2024 > files/flagged_issues.html
"""

import json
from typing import Dict, List, Set
from parse import major_plans, prereqs
from parse_defs import CourseCode, ProcessedCourse
from university import university

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
    "EI": [
        CourseCode("CCE", "1"),
        CourseCode("CCE", "2"),
        CourseCode("CCE", "3"),
        CourseCode("CCE", "120"),
    ],
}


ASSUMED_SATISFIED = [
    CourseCode("MATH", "10A"),
    CourseCode("MATH", "20A"),
    CourseCode("MCWP", "40"),
    CourseCode("MMW", "12"),
    CourseCode("CAT", "1"),
    CourseCode("SYN", "1"),
]

ALLOW_DUPLICATES = [
    CourseCode("MUS", "43"),
    CourseCode("EDS", "139"),
    CourseCode("TDPR", "6"),
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
    dne: List[str]
    missing_major: List[str]

    def __init__(self) -> None:
        self.multiple_options = []
        self.duplicate_courses = []
        self.missing_ges = []
        self.wrong_units = []
        self.miscategorized_courses = []
        self.curriculum_deviances = []
        self.early_upper_division = []
        self.missing_prereqs = []
        self.dne = []
        self.missing_major = []


def check_plan(
    year: int,
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
                    f"[{name}] “{title}” is listed multiple times and has multiple options; assuming {code} each time"
                )
            elif code not in ALLOW_DUPLICATES:
                issues.duplicate_courses.append(
                    f"[{name}] duplicate course {code} “{title}”"
                )
    for code in GES[college]:
        # Hack for PHIL/POLI commutativity
        if code.subject == "POLI" and code not in course_codes:
            code = CourseCode("PHIL", code.number)
        if code not in course_codes:
            issues.missing_ges.append(f"[{name}] Missing writing course {code}")
        elif courses[code].raw.type != "COLLEGE":
            issues.miscategorized_courses.append(
                f"[{name}] “{courses[code].raw.course_title}” is a college writing course but is marked as a major requirement"
            )
    for course in plan:
        # Course title must match to exclude split lab courses
        if (
            course.units != course.raw.units
            and course.course_title == course.raw.course_title
        ):
            issues.wrong_units.append(
                f"[{name}] {course.course_code} (from “{course.raw.course_title}”) should be {course.units} units but is {course.raw.units} units"
            )
        elif (
            course.course_code is not None
            and course.course_code in consensus_units
            and consensus_units[course.course_code] != course.units
        ):
            issues.wrong_units.append(
                f"[{name}] {course.course_code} (from “{course.raw.course_title}”) should be {consensus_units[course.course_code]} units but is {course.units} units"
            )
        # if course.course_title in curriculum:
        #     if not course.for_major:
        #         issues.miscategorized_courses.append(
        #             f"[{name}] Curriculum course “{course.course_title}” marked as GE"
        #         )
        # else:
        #     if course.for_major:
        #         issues.curriculum_deviances.append(
        #             f"[{name}] “{course.raw.course_title}” differs from curriculum"
        #         )
        if (
            course.term_index < 6
            and course.course_code
            and course.course_code.parts()[1] >= 100
        ):
            quarter = ["fall", "winter", "spring"][course.term_index % 3]
            issues.early_upper_division.append(
                f"[{name}] “{course.raw.course_title}” is taken in year {course.term_index // 3 + 1} {quarter} quarter"
            )
        if course.course_code and course.course_code not in ASSUMED_SATISFIED:
            reqs = prereqs(university.get_term_code(year, course.term_index)).get(
                course.course_code
            )
            if reqs is None:
                # Eighth CCE courses don't exist yet
                if course.course_code.subject != "CCE":
                    issues.dne.append(
                        f"[{name}] {course.course_code} (from “{course.raw.course_title}”) does not exist"
                    )
            else:
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
                            f"[{name}] {course.course_code} (from “{course.raw.course_title}”) is missing prereq {or_group}"
                        )


def print_issues(issues: List[str], description: str) -> None:
    if not issues:
        return
    print(f"<h2>{description}</h2>")
    for issue in issues:
        print(f"<p>{issue}</p>")
    print()


def main(year: int, length: int = 4) -> None:
    for college_code, college_name in university.college_names.items():
        issues = Issues()
        for major_code, plans in major_plans(year, length).items():
            if college_code not in plans.colleges:
                if not major_code.startswith("UN"):
                    issues.missing_major.append(f"Missing plan for major {major_code}")
                continue
            curriculum = {course.course_title for course in plans.curriculum()}
            check_plan(
                year,
                major_code,
                curriculum,
                plans.plan(college_code),
                college_code,
                issues,
            )

        print(f"<h1>{college_name}</h1>")
        print_issues(issues.missing_major, "Missing plans")
        print_issues(issues.wrong_units, "Wrong unit numbers")
        print_issues(issues.missing_prereqs, "Missing prerequisites")
        print_issues(
            issues.miscategorized_courses,
            "College GE courses marked as major/department courses",
        )
        print_issues(issues.missing_ges, "Missing college GE")
        print_issues(issues.duplicate_courses, "Duplicate courses")
        print_issues(
            issues.dne,
            "Nonexistent courses",
        )
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
    import sys

    if len(sys.argv) < 2:
        raise ValueError("Need year: python3 courses_req_by_majors.py <year>")
    print("<style>p { margin: 0; white-space: pre-wrap; }</style>")
    main(int(sys.argv[1]))
