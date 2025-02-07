"""
One-off script checking

python3 scrape_instructor_grade_archive_check.py
"""

from collections import defaultdict
import csv


def parse(number: str) -> float:
    return float(number.replace(",", "") or "0")


def as_parse(number: str) -> float:
    return float(number.replace("%", ""))


def main():
    courses: dict[tuple[str, str], float] = {}

    with open("./files/21-22 Enrollment_DFW CJ.xlsx.csv") as file:
        reader = csv.reader(file)
        # Skip header
        next(reader)
        next(reader)
        course_code = ""
        for (
            course,
            _title,
            term,
            _,  # Grand Total: % of Total Enrolled
            total,  # Grand Total: N
            _,  # ABC: % of Total Enrolled
            abc_count,  # ABC: N
            _,  # DFW: % of Total Enrolled
            dfw_count,  # DFW: N
        ) in reader:
            course_code = course or course_code
            if term:
                courses[course_code, term] = parse(dfw_count) / parse(total)
                # the assertion passes, meaning that P/NP is not included
                assert parse(total) == parse(abc_count) + parse(dfw_count)

    # "as" refers to associated students since that's where this data is from
    as_courses_count: dict[tuple[str, str], int] = defaultdict(int)
    as_courses: dict[tuple[str, str], float] = {}

    with open("./scrape_instructor_grade_archive.csv") as file:
        reader = csv.reader(file)
        # Skip header
        next(reader)
        for (
            subject,
            number,
            year,
            quarter,
            _title,
            _instructor,
            _gpa,
            a,
            b,
            c,
            d,
            f,
            w,
            _p,
            _np,
        ) in reader:
            course_code = subject + number
            term = quarter + year
            as_courses_count[course_code, term] += 1
            if as_courses_count[course_code, term] == 1:
                abc_percent = as_parse(a) + as_parse(b) + as_parse(c)
                dfw_percent = as_parse(d) + as_parse(f) + as_parse(w)
                if abc_percent + dfw_percent == 0:
                    as_courses[course_code, term] = 0
                    continue
                as_courses[course_code, term] = dfw_percent / (
                    abc_percent + dfw_percent
                )
            elif as_courses_count[course_code, term] == 2:
                del as_courses[course_code, term]

    intersection = set(courses.keys()) & set(as_courses.keys())
    for key in intersection:
        our_dfw = courses[key]
        as_dfw = as_courses[key]
        if abs(our_dfw - as_dfw) > 0.005:
            print(
                f"difference for {key}. OURS: {our_dfw:.1%}, THEIRS: {as_dfw:.1%}. diff: {abs(our_dfw - as_dfw):.4%}"
            )


if __name__ == "__main__":
    main()
