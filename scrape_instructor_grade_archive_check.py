"""
One-off script checking A.S.'s DFW data

> python3 scrape_instructor_grade_archive_check.py

notes:
- CJ dataset includes P and NP in ABC and DFW, respectively
- sometimes AS percentages dont add up to 100%. why?
- CJ dataset sums across all sections
- AS seems to omit sections with a capacity <= 20
    - good example of this is FILM 87, FA21
"""

from collections import defaultdict
import csv
import re


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
                # actually it seems that it does include P/NP
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
            instructor,
            _gpa,
            a,
            b,
            c,
            d,
            f,
            w,
            p,
            np,
        ) in reader:
            course_code = subject + number
            term = quarter + year
            as_courses_count[course_code, term] += 1
            if as_courses_count[course_code, term] == 1:
                abc_percent = as_parse(a) + as_parse(b) + as_parse(c) + as_parse(p)
                dfw_percent = as_parse(d) + as_parse(f) + as_parse(w) + as_parse(np)
                assert abc_percent + dfw_percent <= 100
                if abc_percent + dfw_percent == 0:
                    as_courses_count[course_code, term] -= 1
                    continue
                if abc_percent + dfw_percent < 95:
                    if abc_percent + dfw_percent < 80:
                        print(
                            f"{term} {course_code} {abc_percent + dfw_percent:.1f} doesnt add to 100% ({instructor})"
                        )
                    as_courses_count[course_code, term] -= 1
                    continue
                # abc_percent -= as_parse(np)
                # dfw_percent -= as_parse(np)
                as_courses[course_code, term] = dfw_percent / (
                    abc_percent + dfw_percent
                )
            elif as_courses_count[course_code, term] == 2:
                # filter out courses with multiple profs
                del as_courses[course_code, term]

    intersection = set(courses.keys()) & set(as_courses.keys())
    results: list[tuple[str, str, float, float, float]] = []
    for key in intersection:
        our_dfw = courses[key]
        as_dfw = as_courses[key]
        if abs(our_dfw - as_dfw) > 0.005:
            results.append((*key, our_dfw, as_dfw, abs(our_dfw - as_dfw)))
    results.sort(key=lambda t: t[4])
    for course_code, term, our_dfw, as_dfw, diff in results:
        print(
            f"difference for {course_code},{term}. OURS: {our_dfw:.1%}, THEIRS: {as_dfw:.1%}. diff: {diff:.4%}"
        )
    print(f"{len(results) / len(intersection):.0%} difference")

    common_terms = {term for _course, term in courses.keys()} & {
        term for _course, term in as_courses_count.keys()
    }
    carlos_keys = set(
        (course, term)
        for course, term in courses.keys()
        # remove grad courses and x97..99 courses
        if term in common_terms
        and int(re.sub(r"[A-Z]", "", course)) < 200
        and not (97 <= int(re.sub(r"[A-Z]", "", course)) % 100 <= 99)
    )
    as_keys = set(
        (course, term)
        for course, term in as_courses_count.keys()
        if term in common_terms
    )
    carlos_has = carlos_keys - as_keys
    print("our data has", len(carlos_has), list(carlos_has)[:5], "and AS doesn't")
    as_has = as_keys - carlos_keys
    print("AS has", as_has, "and we don't")


if __name__ == "__main__":
    main()
