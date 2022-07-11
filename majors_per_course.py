from typing import Dict, Generator, List

from college_names import college_names
from output import rows_to_csv

from parse import major_plans
from parse_course_name import parse_course_name

college_codes = list(college_names.keys())
courses: Dict[str, Dict[str, List[str]]] = {}


def major_has_course(major_code: str, college_code: str, course_code: str) -> None:
    if course_code not in courses:
        courses[course_code] = {college: [] for college in college_codes}
    courses[course_code][college_code].append(major_code)


for major_code, major in major_plans.items():
    for college_code, plan in major.plans.items():
        for quarter in plan.quarters:
            for course in quarter:
                parsed = parse_course_name(course.course_title)
                if parsed is not None:
                    subject, number, has_lab = parsed
                    major_has_course(major_code, college_code, f"{subject} {number}")
                    if has_lab is not None:
                        major_has_course(
                            major_code, college_code, f"{subject} {number + has_lab}"
                        )


def output_courses() -> Generator[List[str], None, None]:
    yield ["Course", *college_codes]

    for course_code in sorted(courses.keys()):
        yield [course_code] + [
            str(len(courses[course_code][college])) for college in college_codes
        ]


with open("./files/majors_per_course.csv", "w") as file:
    for line in rows_to_csv(output_courses(), 1 + len(college_names)):
        file.write(line)
