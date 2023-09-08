"""
python3 course_overlap.py
"""

from parse import major_plans
from util import CsvWriter

HEADER = [
    "Year",
    "Base major",
    "Other major",
    "Percent of base major's courses in other major",
]


def print_year(writer: CsvWriter, year: int) -> None:
    majors = major_plans(year)
    if majors == {}:
        return

    curricula = {
        major: {course for course in plans.curriculum() if course.for_major}
        for major, plans in majors.items()
    }
    major_codes = sorted(majors.keys())
    for base in major_codes:
        for other in major_codes:
            writer.row(
                str(year),
                base,
                other,
                str(
                    len(curricula[base] & curricula[other]) / len(curricula[base])
                    if curricula[base]
                    else 0
                ),
            )


def main() -> None:
    with open("./files/course_overlap_py.csv", "w") as file:
        writer = CsvWriter(len(HEADER), file)
        writer.row(*HEADER)

        for year in range(2015, 2050):
            print_year(writer, year)


if __name__ == "__main__":
    main()
