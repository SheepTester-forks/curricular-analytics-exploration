from typing import Dict, Set
from parse import major_plans, prereqs
from parse_defs import CourseCode

flattened = {
    course_code: {
        course.course_code for alternatives in requirements for course in alternatives
    }
    for course_code, requirements in prereqs("FA21").items()
}


def get_nested_prereqs(code: CourseCode, cache: Set[CourseCode]) -> None:
    if code not in cache:
        if code in flattened:
            cache |= flattened[code]
            for prereq in flattened[code]:
                get_nested_prereqs(prereq, cache)


redundancies: Dict[CourseCode, Set[CourseCode]] = {}

for course_code, requisites in flattened.items():
    prereqs_of_prereqs: Set[CourseCode] = set()
    for prereq in requisites:
        get_nested_prereqs(prereq, prereqs_of_prereqs)
    redundant = {code for code in requisites if code in prereqs_of_prereqs}
    if course_code == ("MATH", "10B"):
        print(prereqs_of_prereqs)
        print(redundant)
        print(requisites)
        exit()
    if redundant:
        redundancies[course_code] = redundant

print(redundancies)

for major_code, major in major_plans(2021).items():
    need_prereq_removal: Set[CourseCode] = set()
    for course in major.curriculum():
        if course.course_code:
            need_prereq_removal.add(course.course_code)
    if need_prereq_removal:
        display = " | ".join(
            f"{subject} {number} <- {', '.join(map( ' '.join, redundancies[CourseCode(subject, number)]))}"
            for subject, number in need_prereq_removal
        )
        print(f"[{major_code}] {display}")
