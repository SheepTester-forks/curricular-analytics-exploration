from typing import List, NamedTuple, Optional, Set
from parse import CourseCode, prereqs


# PHYS 1B requires [MATH 10B, MATH 20B], among others. PHYS 2B requires [MATH
# 20B, MATH 20C, MATH 31BH], among others. PHYS 1C requires [PHYS 1B, PHYS 2B]
# and [MATH 10B, MATH 20B]. Is this redundant? Taking PHYS 2B does not imply you
# have credit for MATH 20B. MATH 20C implies MATH 20B, but MATH 31BH implies
# MATH 31AH, which doesn't imply anything. You could have credit for MATH 31BH
# and not meet the requirements for PHYS 1C. Is that a good thing?

# I'll just assume that *every* alternative is taken.

course_prereqs = {
    course_code: [alt.course_code for req in prereqs for alt in req]
    for course_code, prereqs in prereqs("FA22").items()
}


class TakenCourse(NamedTuple):
    course: CourseCode
    satisfies: CourseCode


class State(NamedTuple):
    taken: List[TakenCourse]
    explored: Set[CourseCode]
    nonexistent: Set[TakenCourse]


def take_prereq(course_code: CourseCode, target: State) -> None:
    if course_code in target.explored:
        return
    target.explored.add(course_code)
    for course in course_prereqs[course_code]:
        target.taken.append(TakenCourse(course, course_code))
        if course in course_prereqs:
            take_prereq(course, target)
        else:
            target.nonexistent.add(TakenCourse(course, course_code))


def redundant_prereqs(
    course_code: CourseCode, nonexistent: Optional[Set[TakenCourse]] = None
) -> List[TakenCourse]:
    state = State([], set(), set())
    prereqs = course_prereqs[course_code]
    for course in prereqs:
        if course in course_prereqs:
            take_prereq(course, state)
        else:
            state.nonexistent.add(TakenCourse(course, course_code))
    if nonexistent is not None:
        nonexistent |= state.nonexistent
    return [
        taken for course in prereqs for taken in state.taken if course == taken.course
    ]


def main() -> None:
    nonexistent: Set[TakenCourse] = set()
    for course in sorted(course_prereqs):
        redundant = redundant_prereqs(course, nonexistent)
        if not redundant:
            continue
        print(f"[{course} redundant prereqs]")
        for course, satisfies in redundant:
            print(f"prereq: {course} (implied by {satisfies})")
    print("[Nonexistent courses]")
    for course, satisfies in nonexistent:
        print(f"{satisfies} requires {course}, which doesn't exist")


if __name__ == "__main__":
    main()
