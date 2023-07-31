"""
python3 course_capacities.py files/ClassCapCalculatorNewStudents.csv > files/course_capacities_output.csv
"""

from typing import Dict, List, NamedTuple, TextIO
from parse import major_plans
from parse_defs import CourseCode

from university import university

YEAR_COUNT = 4


class StudentType(NamedTuple):
    year: int
    "Between 0 and 3 (0-indexed)."
    major: str
    college: str


StudentBody = Dict[StudentType, int]

ClassSizeOutput = Dict[CourseCode, List[int]]


def from_majors(students_by_major: Dict[str, int]) -> StudentBody:
    partitions = YEAR_COUNT * len(university.college_codes)
    students: StudentBody = {}
    for major, count in students_by_major.items():
        for year in range(YEAR_COUNT):
            for college in university.college_codes:
                students[StudentType(year, major, college)] = count // partitions
    return students


def from_first_years(file: TextIO) -> StudentBody:
    students: StudentBody = {}
    # It seems they alphabetized the colleges
    college_codes = dict(
        {name: code for code, name in university.college_names.items()},
        Eighth="EI",
        Roosevelt="FI",
    )
    reader = csv.reader(file)
    _, *college_names, _ = next(reader)  # Skip header
    for major_code, *by_college, _ in reader:
        if len(major_code) != 4:
            continue
        for i, count in enumerate(by_college):
            students[StudentType(0, major_code, college_codes[college_names[i]])] = int(
                count or "0"
            )
    return students


def class_sizes(students: StudentBody, year: int) -> ClassSizeOutput:
    courses: ClassSizeOutput = {}
    for major_code, plans in major_plans(year).items():
        for college in university.college_codes:
            if college not in plans.colleges:
                continue
            for course in plans.plan(college):
                if course.course_code:
                    year, term = university.get_term(course.term_index)
                    student_type = StudentType(year, major_code, college)
                    if student_type in students:
                        if course.course_code not in courses:
                            courses[course.course_code] = [0 for _ in university.terms]
                        courses[course.course_code][term] += students[
                            StudentType(year, major_code, college)
                        ]
    return courses


def output_class_sizes(sizes: ClassSizeOutput, file: TextIO) -> None:
    file.write("Course,")
    file.write(",".join(university.terms))
    file.write("\n")
    for course, size in sorted(sizes.items(), key=lambda item: item[0]):
        file.write(str(course))
        file.write(",")
        file.write(",".join(map(str, size)))
        file.write("\n")


if __name__ == "__main__":
    import csv
    import sys

    with open(sys.argv[1], newline="") as file:
        student_body = from_first_years(file)
    output_class_sizes(class_sizes(student_body, 2022), sys.stdout)
