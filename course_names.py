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

    match = re.search(r"\b([A-Z]{2,4}) *(\d+[A-Z]{0,2})", name)
    if match:
        subject, number = match.group(1, 2)
        if subject in ["IE", "RR"]:
            # International Studies' "Interdisciplinary Elective/Regional
            # Requirement" is not a course name, but it might be worth still
            # returning a prefix/department for these
            return ""
        return f"{subject} {number}"
    return ""


for name in sorted(course_names):
    if not re.match(r"^[A-Z]{2,4} \d{1,3}[A-Z]?$", name):
        # https://stackoverflow.com/a/5676676
        print(f"[{course_names[name]}] {name}".ljust(80) + get_course_code(name))
