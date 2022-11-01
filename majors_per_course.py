import csv
from typing import Dict, Generator, List, Tuple

from college_names import college_names
from common_prereqs import parse_int

from parse import major_plans
from parse_defs import CourseCode

college_codes = list(college_names.keys())
courses: Dict[CourseCode, Dict[str, List[str]]] = {}


def major_has_course(major_code: str, college_code: str, code: CourseCode) -> None:
    if code not in courses:
        courses[code] = {college: [] for college in college_codes}
    courses[code][college_code].append(major_code)


for major_code, major in major_plans(2021).items():
    for college_code in major.colleges:
        for course in major.plan(college_code):
            if course.course_code:
                major_has_course(major_code, college_code, course.course_code)


def to_sortable(code: CourseCode) -> Tuple[str, int, str]:
    subject, course_number = code
    number, letter = parse_int(course_number)
    return subject, number, letter


def output_courses() -> Generator[List[str], None, None]:
    yield ["Course", "College", "Majors"]

    for course_code in sorted(courses.keys(), key=to_sortable):
        for college in college_codes:
            yield [
                " ".join(course_code),
                college,
                str(len(courses[course_code][college])),
            ]


with open("./files/majors_per_course.csv", "w",newline='') as file:
    writer = csv.writer(file)
    for row in output_courses():
        writer.writerow(row)
