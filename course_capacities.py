from typing import Dict, NamedTuple
from parse import major_plans
from parse_defs import CourseCode

from university import university

YEAR_COUNT = 4
YEARS = list(range(1, YEAR_COUNT + 1))


class StudentType(NamedTuple):
    year: int
    "Between 1 and 4."
    major: str
    college: str


StudentBody = Dict[StudentType, int]


def from_majors(students_by_major: Dict[str, int]) -> StudentBody:
    partitions = YEAR_COUNT * len(university.college_codes)
    students: StudentBody = {}
    for major, count in students_by_major.items():
        for year in YEARS:
            for college in university.college_codes:
                students[StudentType(year, major, college)] = count // partitions
    return students


def class_sizes(students: StudentBody, year: int) -> Dict[CourseCode, int]:
    courses: Dict[CourseCode, int] = {}
    for major_code, plans in major_plans(year).items():
        for college in university.college_codes:
            if college not in plans.colleges:
                continue
            for course in plans.plan(college):
                if course.course_code:
                    if course.course_code not in courses:
                        courses[course.course_code] = 0
                    student_type = StudentType(
                        university.get_plan_year(course.term_index),
                        major_code,
                        college,
                    )
                    if student_type in students:
                        courses[course.course_code] += students[
                            StudentType(
                                university.get_plan_year(course.term_index),
                                major_code,
                                college,
                            )
                        ]
    return courses
