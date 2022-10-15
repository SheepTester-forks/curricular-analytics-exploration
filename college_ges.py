from parse import major_plans


units_per_college = {
    major_code: sorted(
        (
            (
                college,
                sum(
                    course.units
                    for course in plans.plan(college)
                    if course.course_title != "ELECTIVE"
                ),
            )
            for college in plans.colleges
        ),
        key=lambda entry: entry[1],
    )
    for major_code, plans in major_plans(2022).items()
}
