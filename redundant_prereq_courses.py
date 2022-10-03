from typing import List, NamedTuple
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


def take_prereq(course_code: CourseCode, target: List[TakenCourse]) -> None:
    for course in course_prereqs[course_code]:
        target.append(TakenCourse(course, course_code))
        take_prereq(course, target)


def redundant_prereqs(course_code: CourseCode) -> List[TakenCourse]:
    implied: List[TakenCourse] = []
    prereqs = course_prereqs[course_code]
    for course in prereqs:
        take_prereq(course, implied)
    redundant: List[TakenCourse] = []
    for course in prereqs:
        for taken in implied:
            if course == taken.course:
                redundant.append(taken)
                break
    return redundant


def main() -> None:
    print("PHYS 1C")
    for course, satisfies in redundant_prereqs(CourseCode("PHYS", "1C")):
        print(f"{course} (-> {satisfies})")


if __name__ == "__main__":
    main()
