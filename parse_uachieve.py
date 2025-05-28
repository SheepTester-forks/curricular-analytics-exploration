"""
$ python parse_uachieve.py 'files/BI35_Major_With_Courses(BI35_Major_With_Courses).csv'
"""

import csv
from typing import Iterator, NamedTuple
from parse_defs import CourseCode


class SingleCourse(NamedTuple):
    """
    a single course in the requirement
    """

    course_code: CourseCode


class SelectOneCourse(NamedTuple):
    """
    an OR group

    MATCHCTL symbols: /, !
    """

    course_codes: list[CourseCode]


class CourseRange(NamedTuple):
    """
    a range of course codes

    MATCHCTL symbols: :, ;
    """

    lower: CourseCode
    upper: CourseCode


class PseudoCourse(NamedTuple):
    """
    like an alias for a group of courses i think

    MATCHCTL symbols: $, P, S
    """

    name: str


CourseRequirement = SingleCourse | SelectOneCourse | CourseRange | PseudoCourse


class RequiredUnits(NamedTuple):
    min_units: float


class RequiredCourses(NamedTuple):
    min_count: int


class Subrequirement(NamedTuple):
    label: str
    minimum: RequiredUnits | RequiredCourses
    courses: list[CourseRequirement]


class Requirement(NamedTuple):
    name: str
    min_subreqs: int
    "minimum number of subrequirements that need to be met"
    subrequirements: list[list[Subrequirement]]
    "within each list, just one subrequirement needs to be met (similar to prereqs)"


def parse_rows(rows: Iterator[list[str]]):
    next(rows)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("python parse_uachieve.py <csv>")
        exit(1)

    reader = csv.reader(sys.argv[1])
    parse_rows(reader)
