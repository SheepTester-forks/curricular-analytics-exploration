"""
python3 plan_metrics.py
"""

from output import MajorOutput
from parse import MajorPlans, major_plans
from university import university
from util import CsvWriter, bool_str, float_str

HEADER = [
    "Year",
    "Major",
    "College",
    # Views
    "Complexity score",
    "Units #",
    "Units in major #",
    "Units not in major #",
    "Longest path #",
    "Longest path courses",
    "Highest complexity #",
    "Highest complexity name",
    "Highest centrality #",
    "Highest centrality name",
    "Highest term unit load",
    "Highest term unit load name",
    "Lowest term unit load",
    "Lowest term unit load name",
    "# redundant prereqs",
    "Redundant prereqs",
    "% of courses with prerequisites",
    "% of units in major",
    # Flags
    "Under 180 units?",
    "Over 200 units?",
    "Has > 16-unit term?",
    "Has < 12-unit term?",
    "Has > 6 unit difference across colleges?",
]


def write_row(
    writer: CsvWriter,
    year: int,
    major: str,
    college: str,
    plans: MajorPlans,
    output: MajorOutput,
    significant_difference: str,
) -> None:
    courses = plans.plan(college)
    degree_plan = output.output_degree_plan(college)
    curriculum = degree_plan.curriculum

    total_units = sum(course.units for course in courses)
    major_units = sum(course.units for course in courses if course.for_major)

    longest_path = curriculum.longest_paths[0] if curriculum.longest_paths else []
    redundant_reqs = curriculum.extraneous_requisites()

    writer.row(
        str(year),  # Year
        major,  # Major
        college,  # College
        float_str(curriculum.total_complexity),  # Complexity score
        float_str(total_units),  # Units #
        float_str(major_units),  # Units in major #
        float_str(total_units - major_units),  # Units not in major #
        str(len(longest_path)),  # Longest path #
        # Longest path courses
        " → ".join(course.name for course in longest_path),
        # Highest complexity #
        float_str(curriculum.basic_metrics.max_complexity),
        # Highest complexity name
        curriculum.basic_metrics.max_complexity_courses[0].name,
        # Highest centrality #
        str(curriculum.basic_metrics.max_centrality),
        # Highest centrality name
        curriculum.basic_metrics.max_centrality_courses[0].name,
        float_str(degree_plan.basic_metrics.max),  # Highest term unit load
        # Highest term unit load name
        university.get_term_code(year, degree_plan.basic_metrics.max_term),
        float_str(degree_plan.basic_metrics.min),  # Lowest term unit load
        # Lowest term unit load name
        university.get_term_code(year, degree_plan.basic_metrics.min_term),
        str(len(redundant_reqs)),  # # redundant prereqs
        ", ".join(
            f"{curriculum.course_from_id(prereq).name} → {curriculum.course_from_id(course).name}"
            for prereq, course in redundant_reqs
        ),  # Redundant prereqs
        float_str(
            sum(bool(course.requisites) for course in curriculum.courses)
            / len(curriculum.courses)
        ),  # % of courses with prerequisites
        float_str(major_units / total_units),  # % of units in major
        # Flags
        bool_str(total_units < 180),  # Under 180 units?
        bool_str(total_units > 200),  # Over 200 units?
        # Has > 16-unit term?
        bool_str(any(term.credit_hours > 16 for term in degree_plan.terms)),
        # Has < 12-unit term?
        bool_str(any(term.credit_hours < 12 for term in degree_plan.terms)),
        significant_difference,  # Has > 6 unit difference across colleges?
    )


def main() -> None:
    with open("./files/metrics_fa12_py.csv", "w") as file:
        writer = CsvWriter(len(HEADER), file)
        writer.row(*HEADER)

        for year in range(2015, 2050):
            majors = major_plans(year)
            if majors == {}:
                break
            for major, plans in majors.items():
                output = MajorOutput(plans)
                plan_units = [
                    course.units
                    for college in university.college_codes
                    if college in plans.colleges
                    for course in plans.plan(college)
                ]
                significant_difference = bool_str(max(plan_units) - min(plan_units) > 6)

                for college in university.college_codes:
                    if college not in plans.colleges:
                        continue
                    write_row(
                        writer,
                        year,
                        major,
                        college,
                        plans,
                        output,
                        significant_difference,
                    )


if __name__ == "__main__":
    main()
