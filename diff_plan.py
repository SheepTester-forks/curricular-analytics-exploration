from difflib import SequenceMatcher
from typing import List, NamedTuple, Optional, Tuple

from parse import RawCourse, major_plans


class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"


class DiffResults(NamedTuple):
    added: List[RawCourse]
    removed: List[RawCourse]
    changed: List[Tuple[RawCourse, RawCourse]]
    unit_change: float

    def print(self) -> None:
        for course in self.removed:
            print(f"{Colors.RED}- {course.course_title}{Colors.RESET}")
        for old, new in self.changed:
            print(
                "* "
                + (
                    f"{Colors.YELLOW}{old.course_title} → {new.course_title}{Colors.RESET}"
                    if old.course_title != new.course_title
                    else new.course_title
                )
                + (
                    f" · {Colors.YELLOW}{old.units} → {new.units}{Colors.RESET} units"
                    if old.units != new.units
                    else ""
                )
                + (
                    f" · term {Colors.YELLOW}{old.term + 1} → {new.term + 1}{Colors.RESET}"
                    if old.term != new.term
                    else ""
                )
                + (
                    f" · {Colors.YELLOW}{old.type} → {new.type}{Colors.RESET}"
                    if old.type != new.type
                    else ""
                )
                + (
                    f" · overlaps GE? {Colors.YELLOW}{old.overlaps_ge} → {new.overlaps_ge}{Colors.RESET}"
                    if old.overlaps_ge != new.overlaps_ge
                    else ""
                )
            )
        for course in self.added:
            print(f"{Colors.GREEN}+ {course.course_title}{Colors.RESET}")


def similarity(a: str, b: str) -> float:
    # https://stackoverflow.com/a/17388505
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def diff(old: List[RawCourse], new: List[RawCourse]) -> DiffResults:
    old_only = [course for course in old if course not in new]
    new_only = [course for course in new if course not in old]
    changed: List[Tuple[RawCourse, RawCourse]] = []

    # Prioritize matching courses with the same course title
    for course in old_only[:]:
        for other in new_only:
            if course.course_title.lower() == other.course_title.lower():
                old_only.remove(course)
                new_only.remove(other)
                changed.append((course, other))
                break
    # Match courses based on similarity
    for course in old_only[:]:
        max_similarity = 0
        most_similar: Optional[RawCourse] = None
        for other in new_only:
            sim = similarity(course.course_title, other.course_title)
            if sim > max_similarity:
                max_similarity = sim
                most_similar = other
        if most_similar:
            old_only.remove(course)
            new_only.remove(most_similar)
            changed.append((course, most_similar))

    return DiffResults(
        new_only,
        old_only,
        changed,
        sum(course.units for course in new) - sum(course.units for course in old),
    )


if __name__ == "__main__":
    # https://stackoverflow.com/questions/287871/how-do-i-print-colored-text-to-the-terminal#comment113206663_21786287
    import os

    if os.name == "nt":
        os.system("color")

    major = "BE25"
    college = "RE"
    for year in range(2015, 2022):
        differences = diff(
            major_plans(year)[major].raw_plans[college],
            major_plans(year + 1)[major].raw_plans[college],
        )
        # https://stackoverflow.com/a/8337012
        print(
            f"{Colors.BOLD}{year + 1} changes{Colors.RESET}"
            + (
                f" ({differences.unit_change:+g} units)"
                if differences.unit_change != 0
                else ""
            )
        )
        differences.print()

# do it for every year
# just print the added and removed courses
