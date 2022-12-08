"""
python3 dump_prereqs.py FA22
python3 dump_prereqs.py FA22 table > files/blocked.csv
"""

import json
import sys
from typing import Dict, List, Set
from parse import prereqs
from parse_defs import CourseCode, Prerequisite

Prereqs = Dict[CourseCode, List[List[Prerequisite]]]


def dump_prereqs(all_reqs: Prereqs) -> None:
    """
    Creates prereqs.json for reports/prereq-tree.tsx.
    """
    with open("./reports/output/prereqs.json", "w") as file:
        json.dump(
            {
                str(course_code): [
                    [str(alt.course_code) for alt in req] for req in reqs
                ]
                for course_code, reqs in all_reqs.items()
            },
            file,
        )


def prereqs_satisfied(taken: Set[CourseCode], reqs: List[List[Prerequisite]]) -> bool:
    for req in reqs:
        for alt in req:
            if alt.course_code in taken:
                return True
    return False


def blocking_table(all_reqs: Prereqs) -> None:
    """
    Creates a CSV listing how many courses each course blocks.
    """
    print("Course,Number of courses blocked by the course")

    # Not efficient, but more closely mimics the algorithm that prereq-tree uses
    for blocker in all_reqs.keys():
        taken: Set[CourseCode] = {blocker}
        while True:
            new_courses: Set[CourseCode] = set()
            for course_code, reqs in all_reqs.items():
                if not reqs or course_code in taken:
                    continue
                if prereqs_satisfied(taken, reqs):
                    new_courses.add(course_code)
            if new_courses:
                taken |= new_courses
            else:
                break
        print(f"{blocker},{len(taken)}")


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2] == "table":
        blocking_table(prereqs(sys.argv[1]))
    else:
        dump_prereqs(prereqs(sys.argv[1]))
