from typing import Dict, Generator, List, Tuple

from college_names import college_names
from common_prereqs import parse_int
from output import rows_to_csv

from parse import CourseCode, major_plans
from parse_course_name import parse_course_name

college_codes = list(college_names.keys())
courses: Dict[CourseCode, Dict[str, List[str]]] = {}


def major_has_course(major_code: str, college_code: str, code: CourseCode) -> None:
    if code not in courses:
        courses[code] = {college: [] for college in college_codes}
    courses[code][college_code].append(major_code)


for major_code, major in major_plans(2021).items():
    for college_code, plan in major.plans.items():
        for quarter in plan.quarters:
            for course in quarter:
                parsed = parse_course_name(course.course_title)
                if parsed is not None:
                    subject, number, has_lab = parsed
                    major_has_course(major_code, college_code, (subject, number))
                    if has_lab is not None:
                        major_has_course(
                            major_code, college_code, (subject, number + has_lab)
                        )


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


with open("./files/majors_per_course.csv", "w") as file:
    for line in rows_to_csv(output_courses(), 3):
        file.write(line)
