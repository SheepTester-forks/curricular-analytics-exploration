import re
from parse import major_plans

course_names = {
    course.course_code.strip("^* "): f"{major_plan.major_code} {college}"
    for major_plan in major_plans.values()
    for college, plan in major_plan.plans.items()
    for quarter in plan.quarters
    for course in quarter
}


def get_course_code(name: str) -> str:
    # Remove International Studies' Disciplinary Focus prefix
    name = re.sub(r"DF-?\d - ", "", name)

    # Special case for physics labs or language analysis sections, which are
    # often merged with its corresponding course, eg "PHYS 2C & 2CL"
    match = re.search(
        r"\b([A-Z]{2,4}) *(\d+[A-Z]{0,2})(?: *[&/] *\d?[A-Z]([LX]))?", name
    )
    if match:
        subject, number, has_lab = match.group(1, 2, 3)
        if subject in ["IE", "RR"]:
            # International Studies' "Interdisciplinary Elective/Regional
            # Requirement" is not a course name, but it might be worth still
            # returning a prefix/department for these
            return ""
        if has_lab:
            return f"{subject} {number}, {subject} {number}{has_lab}"
        return f"{subject} {number}"
    return ""


for name in sorted(course_names):
    if not re.match(r"^[A-Z]{2,4} \d{1,3}[A-Z]?$", name):
        # https://stackoverflow.com/a/5676676
        print(f"[{course_names[name]}] {name}".ljust(80) + get_course_code(name))
