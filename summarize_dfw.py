"""
python3 summarize_dfw.py './files/21-22 Enrollment_DFW CJ.xlsx.csv' 4 > files/protected/summarize_dfw.json
"""

import csv
import json
import sys
from typing import Dict


def parse(number: str) -> float:
    return float(number.replace(",", "") or "0")


def main():
    if len(sys.argv) < 2:
        print("python3 summarize_dfw.py <path> [min_enrolled]")
        exit(1)

    min_enrolled = int(sys.argv[2]) if len(sys.argv) >= 3 else 0
    courses: Dict[str, float] = {}

    with open(sys.argv[1]) as file:
        reader = csv.reader(file)
        # Skip header
        next(reader)
        next(reader)
        course_code = ""
        for (
            course,
            title,
            _,
            _,  # Grand Total: % of Total Enrolled
            total,  # Grand Total: N
            _,  # ABC: % of Total Enrolled
            _,  # ABC: N
            _,  # DFW: % of Total Enrolled
            dfw_count,  # DFW: N
        ) in reader:
            course_code = course or course_code
            if title == "Total" and parse(total) > min_enrolled:
                courses[course_code] = parse(dfw_count) / parse(total)

    # Sort by highest DFW first
    courses = dict(sorted(courses.items(), key=lambda item: (-item[1], item[0])))

    json.dump(courses, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
