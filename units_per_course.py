from functools import cmp_to_key
from typing import Dict, List, NamedTuple
from parse import CourseCode, MajorPlans, major_plans

MAX_SAMPLE_LEN = 5


class PlanId(NamedTuple):
    year: int
    major: str
    college: str

    def __str__(self) -> str:
        return f"{self.year} {self.major} {self.college}"


def comp_plan_id(a: PlanId, b: PlanId) -> int:
    """
    Prioritizes most recent plans first, then lists different majors rather than
    their different colleges.
    """
    if a.year != b.year:
        return b.year - a.year
    if a.major != b.major:
        return -1 if a.major < b.major else 1
    return MajorPlans.least_weird_colleges.index(
        a.college
    ) - MajorPlans.least_weird_colleges.index(b.college)


UnitVariant = List[PlanId]


def main() -> None:
    import sys

    courses: Dict[CourseCode, Dict[float, UnitVariant]] = {}

    for year in range(2015, 2023):
        for major_code, colleges in major_plans(year).items():
            for college in colleges.colleges:
                for course in colleges.plan(college):
                    if not course.course_code:
                        continue
                    variants = courses.get(course.course_code) or {}
                    if course.course_code not in courses:
                        courses[course.course_code] = variants
                    unit_variant = variants.get(course.units) or []
                    if course.units not in variants:
                        variants[course.units] = unit_variant
                    unit_variant.append(PlanId(year, major_code, college))

    if len(sys.argv) > 1 and sys.argv[1] == "json":
        # Output JSON mapping course code to probably correct unit count
        printed = False
        print("{")
        for course_code, variants in courses.items():
            if len(variants) <= 1:
                continue
            if printed:
                print(",")
            else:
                printed = True
            most_common_count = max(len(variant) for variant in variants.values())
            most_common_units = next(
                units
                for units, variant in variants.items()
                if len(variant) == most_common_count
            )
            print(f'  "{course_code}": {most_common_units}', end="")
        print()
        print("}")
        return

    for course_code, variants in courses.items():
        if len(variants) <= 1:
            continue
        print(f"{course_code}")
        for units, variant in variants.items():
            samples = ", ".join(
                [str(p) for p in sorted(variant, key=cmp_to_key(comp_plan_id))][0:5]
            )
            print(f"{units} units ({len(variant)}): {samples}")


if __name__ == "__main__":
    main()
