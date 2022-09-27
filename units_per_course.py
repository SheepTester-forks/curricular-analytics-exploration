from typing import Dict, List, NamedTuple
from parse import CourseCode, major_plans

MAX_SAMPLE_LEN = 5


class PlanId(NamedTuple):
    year: int
    major: str
    college: str

    def __str__(self) -> str:
        return f"{self.year} {self.major} {self.college}"


class UnitVariant:
    count = 0
    sample: List[PlanId]

    def __init__(self) -> None:
        self.sample = []


def main() -> None:
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
                    unit_variant = variants.get(course.units) or UnitVariant()
                    if course.units not in variants:
                        variants[course.units] = unit_variant
                    unit_variant.count += 1
                    if len(unit_variant.sample) < MAX_SAMPLE_LEN:
                        unit_variant.sample.append(PlanId(year, major_code, college))

    for course_code, variants in courses.items():
        if len(variants) <= 1:
            continue
        print(f"{course_code}")
        for units, variant in variants.items():
            print(
                f"{units} units ({variant.count}): {', '.join(str(p) for p in variant.sample)}"
            )


if __name__ == "__main__":
    main()
