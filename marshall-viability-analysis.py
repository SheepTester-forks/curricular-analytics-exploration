from typing import Callable, List, Set, Tuple
from parse import ParsedCourse, major_plans


def simplify(
    get_curriculum: Callable[[], List[ParsedCourse]]
) -> Set[Tuple[str, float]]:
    try:
        curriculum = get_curriculum()
    except KeyError:
        return {("No curriculum. Sad!", 0.0)}
    return {(course.course_title, course.units) for course in curriculum}


UNFUNNY = "TH"  # Least funny college per oddity analysis
colleges = ["RE", "MU", "TH", "WA", "FI", "SI", "SN"]

for major_plan in major_plans(2021).values():
    good_curriculum = simplify(lambda: major_plan.curriculum(UNFUNNY))

    curricula = {
        college: simplify(lambda: major_plan.curriculum(college))
        for college in colleges
        if college != UNFUNNY
    }

    differences = {
        college: (curriculum - good_curriculum, good_curriculum - curriculum)
        for college, curriculum in curricula.items()
        if curriculum != good_curriculum
    }

    if len(differences) == len(colleges) - 1:
        print(f"= {UNFUNNY} is the problematic one for {major_plan.major_code} =")
        for college in colleges:
            if college != UNFUNNY:
                print(f"== {college} ==")
                print(f"[{college}] {differences[college][0] or '🗿'}")
                print(f"[{UNFUNNY}] {differences[college][1] or '🗿'}")
        print()

print("Have a nice day.")
