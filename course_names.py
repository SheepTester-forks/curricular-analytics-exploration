import re
from parse import major_plans

course_names = {
    course.course_code.strip("^* "): major_plan.major_code
    for major_plan in major_plans.values()
    for plan in major_plan.plans.values()
    for quarter in plan.quarters
    for course in quarter
}


def get_course_code(name: str) -> str:
    match = re.search(r"\b([A-Z]{2,4}) (\d+[A-Z]{0,2})(?: *& *(\d+[A-Z]{0,2}))?", name)
    if match:
        subject, number1, number2 = match.group(1, 2, 3)
        if number2:
            return f"{subject} {number1}, {subject} {number2}"
        else:
            return f"{subject} {number1}"
    return ""


for name in sorted(course_names):
    if not re.match(r"^[A-Z]{2,4} \d{1,3}[A-Z]?$", name):
        # https://stackoverflow.com/a/5676676
        print(f"[{course_names[name]}] {name}".ljust(80) + get_course_code(name))
