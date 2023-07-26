"""
python3 course_capacities.py test_input.csv
"""

from typing import Dict, NamedTuple, TextIO
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
                    student_type = StudentType(
                        university.get_plan_year(course.term_index),
                        major_code,
                        college,
                    )
                    if student_type in students:
                        if course.course_code not in courses:
                            courses[course.course_code] = 0
                        courses[course.course_code] += students[
                            StudentType(
                                university.get_plan_year(course.term_index),
                                major_code,
                                college,
                            )
                        ]
    return courses


def output_class_sizes(sizes: Dict[CourseCode, int], file: TextIO) -> None:
    file.write("Course,Size\n")
    for course, size in sizes.items():
        file.write(f"{course},{size}\n")


if __name__ == "__main__":
    import csv
    import sys

    majors: Dict[str, int] = {}
    with open(sys.argv[1], newline="") as file:
        reader = csv.reader(file)
        next(reader)  # Skip header
        for major_code, count in reader:
            majors[major_code] = int(count)
    output_class_sizes(class_sizes(from_majors(majors), 2022), sys.stdout)
