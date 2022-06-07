import re
from parse import major_plans

course_names = {
    course.course_code.strip("^* ")
    for major_plan in major_plans.values()
    for plan in major_plan.plans.values()
    for quarter in plan.quarters
    for course in quarter
}

for name in sorted(course_names):
    if not re.match(r"^[A-Z]{2,4} \d{1,3}[A-Z]?$", name):
        print(name)
