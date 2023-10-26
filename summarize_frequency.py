"""
python3 summarize_frequency.py './files/21-22 Enrollment_DFW CJ.xlsx.csv' 4 > files/protected/summarize_frequency.json
"""


import csv
import json
import sys
from typing import Dict, Set

from parse_defs import TermCode


def parse(number: str) -> float:
    return float(number.replace(",", "") or "0")


def main():
    if len(sys.argv) < 2:
        print("python3 summarize_frequency.py <path>")
        exit(1)

    course_offerings: Dict[str, Set[TermCode]] = {}
    all_terms: Set[TermCode] = set()

    with open(sys.argv[1]) as file:
        reader = csv.reader(file)
        # Skip header
        next(reader)
        next(reader)
        course_code = ""
        for (
            course,
            _,
            term,
            _,  # Grand Total: % of Total Enrolled
            _,  # Grand Total: N
            _,  # ABC: % of Total Enrolled
            _,  # ABC: N
            _,  # DFW: % of Total Enrolled
            _,  # DFW: N
        ) in reader:
            if not term:
                continue
            course_code = course or course_code
            if course_code not in course_offerings:
                course_offerings[course_code] = set()
            term = TermCode(term)
            course_offerings[course_code].add(term)
            all_terms.add(term)

    # Sort by highest DFW first
    courses = dict(
        (course_code, len(terms) / len(all_terms))
        for course_code, terms in sorted(
            course_offerings.items(), key=lambda item: (-len(item[1]), item[0])
        )
    )

    json.dump(courses, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
