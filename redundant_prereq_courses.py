from typing import List, NamedTuple, Optional, Set, Tuple
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


# First course in list is the earliest prereq
PrereqChain = Tuple[CourseCode, ...]


class State(NamedTuple):
    taken: List[PrereqChain]
    explored: Set[CourseCode]
    nonexistent: Set[PrereqChain]


def take_prereq(course_code: CourseCode, target: State, satisfies: PrereqChain) -> None:
    if course_code in target.explored:
        return
    target.explored.add(course_code)
    for course in course_prereqs[course_code]:
        chain = course, *satisfies
        target.taken.append(chain)
        if course in course_prereqs:
            take_prereq(course, target, chain)
        else:
            target.nonexistent.add(chain)


def redundant_prereqs(
    course_code: CourseCode, nonexistent: Optional[Set[PrereqChain]] = None
) -> List[PrereqChain]:
    state = State([], set(), set())
    prereqs = course_prereqs[course_code]
    for course in prereqs:
        if course in course_prereqs:
            take_prereq(course, state, (course, course_code))
        else:
            state.nonexistent.add((course, course_code))
    if nonexistent is not None:
        nonexistent |= state.nonexistent
    return [taken for course in prereqs for taken in state.taken if course == taken[0]]


def main() -> None:
    nonexistent: Set[PrereqChain] = set()
    for course in sorted(course_prereqs):
        redundant = redundant_prereqs(course, nonexistent)
        if not redundant:
            continue
        print(f"[{course}]")
        for course, *satisfies in redundant:
            chain = " → ".join(str(course) for course in satisfies)
            print(f"Has redundant prereq {course}, which was already taken for {chain}")
    print("[Nonexistent courses]")
    for course, satisfies, *_ in nonexistent:
        print(f"{satisfies} requires {course}, which doesn't exist")


if __name__ == "__main__":
    main()
