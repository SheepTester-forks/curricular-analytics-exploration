"""
python3 summarize_waitlist.py './files/Waitlist by Course for CJ.xlsx.csv' > files/protected/summarize_waitlist.json
"""


import csv
import json
import sys
from typing import Dict

from parse_defs import TermCode


def parse(number: str) -> int:
    return int(number.replace(",", "") or "0")


class Averager:
    total: int = 0
    count: int = 0

    @property
    def average(self) -> float:
        return self.total / self.count


def main():
    if len(sys.argv) < 2:
        print("python3 summarize_waitlist.py <path>")
        exit(1)

    waitlists: Dict[str, Averager] = {}

    with open(sys.argv[1]) as file:
        reader = csv.reader(file)
        # Skip header
        next(reader)
        course_code = ""
        for (
            course,  # Course Subject Code and Number
            _,  # Course Title or "Total"
            term,  # Term Code
            waitlist,  # Waitlist
        ) in reader:
            if not term:
                continue
            course_code = course or course_code
            term = TermCode(term)
            if course_code not in waitlists:
                waitlists[course_code] = Averager()
            waitlists[course_code].total += parse(waitlist)
            waitlists[course_code].count += 1

    # Sort by highest waitlist first
    courses = dict(
        (course_code, waitlist.average)
        for course_code, waitlist in sorted(
            waitlists.items(), key=lambda item: -item[1].average
        )
    )

    json.dump(courses, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
