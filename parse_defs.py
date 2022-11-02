from functools import total_ordering
from typing import Literal, NamedTuple, Optional, Tuple


@total_ordering
class TermCode(str):
    quarters = ["WI", "SP", "S1", "S2", "S3", "SU", "FA"]

    def quarter(self) -> str:
        return self[0:2]

    def quarter_value(self) -> int:
        return TermCode.quarters.index(self.quarter())

    def year(self) -> int:
        # Assumes 21st century (all the plans we have are in the 21st century)
        return 2000 + int(self[2:4])

    def __lt__(self, other: str) -> bool:
        if not isinstance(other, TermCode):
            raise NotImplemented
        if self.year() == other.year():
            return self.quarter_value() < other.quarter_value()
        else:
            return self.year() < other.year()


class CourseCode(NamedTuple):
    subject: str
    number: str

    def parts(self) -> Tuple[str, int, str]:
        for i, char in enumerate(self.number):
            if not char.isdigit():
                index = i
                break
        else:
            index = len(self.number)
            # Return 1000 so WARR CULTD gets put after all numbers
        return (
            self.subject,
            int(self.number[0:index]) if index > 0 else 1000,
            self.number[index:],
        )

    def __str__(self) -> str:
        return f"{self.subject} {self.number}"


class Prerequisite(NamedTuple):
    course_code: CourseCode
    allow_concurrent: bool

    def __repr__(self) -> str:
        return f"{self.course_code}{'*' if self.allow_concurrent else ''}"


class RawCourse(NamedTuple):
    """
    Represents a course in an academic plan containing raw values from the CSV,
    so lab courses may be merged into a single course. Course codes aren't
    parsed immediately for performance reasons.
    """

    course_title: str
    units: float
    type: Literal["COLLEGE", "DEPARTMENT"]
    overlaps_ge: bool
    year: int
    quarter: int


class ProcessedCourse(NamedTuple):
    """
    Represents a course in an academic plan.

    `course_title` has been cleaned up by `clean_course_title`.

    `term_index` represents the *n*th term in the plan and isn't tied to a
    specific year.
    """

    course_title: str
    course_code: Optional[CourseCode]
    units: float
    for_major: bool
    term_index: int
    raw: RawCourse
