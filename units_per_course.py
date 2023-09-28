"""
python3 units_per_course.py > units_per_course.txt
python3 units_per_course.py json > units_per_course.json

python3 units_per_course.py (json) [year]
"""

from functools import cmp_to_key
from typing import Dict, List, NamedTuple
from parse import major_plans
from parse_defs import CourseCode
from university import university

MAX_SAMPLE_LEN = 5


class PlanId(NamedTuple):
    year: int
    major: str
    college: str

    def __str__(self) -> str:
        return f"{self.year} {self.major} {self.college}"


def comp_plan_id(a: PlanId, b: PlanId) -> int:
    """
    Sort the plans to highlight a variety of years and colleges.
    """
    if a.major != b.major:
        return -1 if a.major < b.major else 1
    if a.college != b.college:
        return university.curriculum_priority.index(
            a.college
        ) - university.curriculum_priority.index(b.college)
    return b.year - a.year


UnitVariant = List[PlanId]


def main() -> None:
    import sys

    courses: Dict[CourseCode, Dict[float, UnitVariant]] = {}

    try:
        max_year = int(sys.argv[2])
        years = [max_year]
    except (ValueError, IndexError):
        years = range(2015, 2024)
        max_year = max(years)
    json_mode = len(sys.argv) > 1 and sys.argv[1] == "json"

    def score(variant: UnitVariant) -> float:
        # Prioritize more recent years
        return sum(0.9 ** (max_year - plan.year) for plan in variant)

    for year in years:
        for major_code, colleges in major_plans(year).items():
            for college in colleges.colleges:
                for course in colleges.plan(college):
                    if not course.course_code:
                        continue
                    variants = courses.get(course.course_code) or {}
                    if course.course_code not in courses:
                        courses[course.course_code] = variants
                    unit_variant = variants.get(course.raw.units) or []
                    if course.raw.units not in variants:
                        variants[course.raw.units] = unit_variant
                    unit_variant.append(PlanId(year, major_code, college))

    if json_mode:
        # Output JSON mapping course code to probably correct unit count
        printed = False
        print("{")
        for course_code, variants in sorted(courses.items(), key=lambda item: item[0]):
            if len(variants) <= 1:
                continue
            if printed:
                print(",")
            else:
                printed = True
            most_common_count = max(score(variant) for variant in variants.values())
            most_common_units = next(
                units
                for units, variant in variants.items()
                if score(variant) == most_common_count
            )
            print(f'  "{course_code}": {most_common_units}', end="")
        print()
        print("}")
        return

    for course_code, variants in sorted(courses.items(), key=lambda item: item[0]):
        if len(variants) <= 1:
            continue
        print(f"{course_code}")
        for units, variant in sorted(
            variants.items(), key=lambda item: -score(item[1])
        ):
            samples = ", ".join(
                [str(p) for p in sorted(variant, key=cmp_to_key(comp_plan_id))][0:5]
            )
            print(
                f"{units} units (score: {score(variant):.2f}; {len(variant)}): {samples}"
            )


if __name__ == "__main__":
    main()
