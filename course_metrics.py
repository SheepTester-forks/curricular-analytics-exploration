"""
python3 course_metrics.py
"""

from curricularanalytics import Course

from output import MajorOutput
from parse import major_plans
from util import CsvWriter, float_str

HEADER = [
    "Year",
    "Major",
    "Course",
    "Complexity",
    "Centrality",
    "Year taken in plan",
    "Blocking factor",
    "Delay factor",
]


def main() -> None:
    with open("./files/courses_fa12_py.csv", "w") as file:
        writer = CsvWriter(len(HEADER), file)
        writer.row(*HEADER)

        for year in range(2015, 2050):
            majors = major_plans(year)
            if majors == {}:
                break
            for major, plans in majors.items():
                degree_plan = MajorOutput(plans).output_degree_plan()
                curriculum = degree_plan.curriculum
                for course in curriculum.courses:
                    assert isinstance(course, Course)
                    if course.prefix == "":
                        continue
                    writer.row(
                        str(year),  # Year
                        major,  # Major
                        f"{course.prefix} {course.num}",  # Course
                        float_str(curriculum.complexity(course)),  # Complexity
                        str(curriculum.centrality(course)),  # Centrality
                        str(degree_plan.find_term(course)),  # Year taken in plan
                        float_str(
                            curriculum.blocking_factor(course)
                        ),  # Blocking factor
                        float_str(curriculum.delay_factor(course)),  # Delay factor
                    )


if __name__ == "__main__":
    main()
