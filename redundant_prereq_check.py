from typing import Set
from parse import CourseCode, prereqs

flattened = {
    course_code: {
        course.course_code for alternatives in requirements for course in alternatives
    }
    for course_code, requirements in prereqs.items()
}


def get_nested_prereqs(code: CourseCode, cache: Set[CourseCode]) -> None:
    if code not in cache:
        if code in flattened:
            cache |= flattened[code]
            for prereq in flattened[code]:
                get_nested_prereqs(prereq, cache)


for course_code, requisites in flattened.items():
    prereqs_of_prereqs: Set[CourseCode] = set()
    for prereq in requisites:
        get_nested_prereqs(prereq, prereqs_of_prereqs)
    redundant = {code for code in requisites if code in prereqs_of_prereqs}
    if len(redundant) > 0:
        print(f"[{course_code}] {redundant}")
