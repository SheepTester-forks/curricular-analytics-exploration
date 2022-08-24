from typing import List, NamedTuple

from parse import RawCourse, major_plans


class DiffResults(NamedTuple):
    added: List[RawCourse]
    removed: List[RawCourse]

    def print(self) -> None:
        for course in self.removed:
            print(f"\033[31m- {course.course_title}")
        for course in self.added:
            print(f"\033[32m+ {course.course_title}")


def diff(old: List[RawCourse], new: List[RawCourse]) -> DiffResults:
    old_only = [course for course in old if course not in new]
    new_only = [course for course in new if course not in old]
    return DiffResults(new_only, old_only)


if __name__ == "__main__":
    # https://stackoverflow.com/questions/287871/how-do-i-print-colored-text-to-the-terminal#comment113206663_21786287
    import os

    os.system("color")

    diff(
        major_plans(2020)["BE25"].raw_plans["RE"],
        major_plans(2021)["BE25"].raw_plans["RE"],
    ).print()

# do it for every year
# just print the added and removed courses
