from parse import major_plans


def simplify(title: str) -> str:
    return title.strip("^* ")


course_titles = {
    course.course_title: f"{major_plan.major_code} {college}"
    for major_plan in major_plans.values()
    for college, plan in major_plan.plans.items()
    for quarter in plan.quarters
    for course in quarter
}

for title in sorted(course_titles):
    # Currently excludes practicum
    if any(char in title for char in "*^(/-¹") or title.startswith("1"):
        print(f"[{course_titles[title]}] {title}".ljust(80) + simplify(title))
