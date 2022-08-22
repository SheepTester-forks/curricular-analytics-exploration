"""
Based on https://www.overleaf.com/project/62e8265ff1395d787286ea5b
"""

import itertools
import re
from typing import Dict
from parse import major_plans

# https://stackoverflow.com/a/93029
control_chars = re.escape(
    "".join(map(chr, itertools.chain(range(0x00, 0x20), range(0x7F, 0xA0))))
)

removals = {
    # 11.
    "(ANTH 1) SOCIAL SCIENCE GE": "SOCIAL SCIENCE GE",
    "(ANTH 2) SOCIAL SCIENCE GE": "SOCIAL SCIENCE GE",
    # 12.
    '"UD ELECTIVE': "UD ELECTIVE",
    # 13.
    "MATH 11 (MATH GE SEE NOTE) / PSYC 60": "MATH 11 / PSYC 60",
    # 14.
    "MATH 10A / 20A (MATH GE SEE NOTE) / MGT 3": "MATH 10A / 20A / MGT 3",
    # 15.
    "MATH 11 (MATH GE)": "MATH 11",
    # 16.
    "TECHNICAL ELECTIVE (TE)": "TECHNICAL ELECTIVE",
    # 17.
    "ELECTIVE (2 / 4 UNITS)": "ELECTIVE",
    "ELECTIVE (2, 3 / 4 UNITS)": "ELECTIVE",
    # 18.
    "BILD 1 (GENETICS PREREQ)": "BILD 1",
    # 19.
    "LD INTRO COURSE (EG GLBH 20)": "LD INTRO COURSE",
    "LD INTRO COURSE (EG SOCI 30)": "LD INTRO COURSE",
    # 20.
    "STATISTICS (QUANTITATIVE METHODS)": "STATISTICS",
    # 21.
    "BENG DE COURSE (ASSIGNED)": "BENG DE COURSE",
    # 22.
    "MAJOR CLASSES / ELECTIVES (VARIES)": "MAJOR CLASSES / ELECTIVES",
    "MAJOR CLASSES AND ELECTIVES (VARIES)": "MAJOR CLASSES AND ELECTIVES",
    # 23.
    "COGS 14B / PSYC 60 (STATS REQUIREMENT)": "COGS 14B / PSYC 60",
    # 26.
    "PHIL 10 (MATH GE)": "PHIL 10",
    # 27.
    "MATH 10A / 20A (NATURAL SCIENCE MAJOR)": "MATH 10A / 20A",
    "MATH 10B / 20B (NATURAL SCIENCE MAJOR)": "MATH 10B / 20B",
    # 28.
    "SOCIAL SCIENCE (REVELLE)": "SOCIAL SCIENCE",
    # 29.
    "CSE ELECTIVE (CSE 197)": "CSE ELECTIVE",
    # 30.
    "CENG 1 (OR CENG 4)": "CENG 1 / CENG 4",
    # 31.
    "ELECTIVE (UD)": "ELECTIVE UD",
    # 32.
    "ECE 111 (OR ECE 140B)": "ECE 111 / ECE 140B",
    # 33.
    "CSE 141 (OR CSE 142)": "CSE 141 / CSE 142",
    "CSE 141L (OR CSE 142L)": "CSE 141L / CSE 142L",
}


def clean_course_name(name: str) -> str:
    # 1. Strip *, ^, ~, #, +, non-ASCII, and <I> and </I> from the names
    name = re.sub(r"[*^~.#+=%s]+|<..?>" % control_chars, "", name)

    # 2. Strip trailing and leading spaces
    name = name.strip()

    # 3. Strip mentions of a writing requirement preceded by a "/"
    name = re.sub(r"\s*/\s*(AWPE?|A?ELWR|SDCC)", "", name)

    # 4. Turn everything uppercase
    name = name.upper()

    # 5. Turn ORs into / and standardize spacing around "/"
    name = re.sub(r"\s+OR\s+|\s*/\s*", " / ", name)

    # 6. Fix spacing on all "-"
    name = re.sub(r"-+", " - ", name)

    # 7. Standardize spacing
    name = re.sub(r" +", " ", name)

    # 8. Remove parenthesis containing GE SEE NOTE, NOTE, FOR, SEE, REQUIRES, or
    #    (ONLY) OFFERED
    name = re.sub(r" ?\( ?(GE SEE|NOTE|FOR|SEE|REQUIRES|ONLY|OFFERED)[^)]*\)", "", name)

    # 9. Remove unnecessary digits at the start of a course name
    name = re.sub(r"^\d+ ", "", name)

    # 10. Replace Elect and elec for Elective
    name = re.sub(r"ELECT?\b", "ELECTIVE", name)

    # Removals
    if name in removals:
        name = removals[name]

    # 24. Remove the (VIS) tag
    name = name.replace(" (VIS)", "")

    # 25. Remove the () around the numbered elective in NE ELECTIVE #
    if name.startswith("NE ELECTIVE "):
        name = re.sub(r"[()]", "", name)

    # 34. Complete incomplete words
    name = re.sub(r"TECH\b", "TECHNICAL", name)
    name = re.sub(r"REQUIRE\b", "REQUIREMENT", name)
    name = re.sub(r"BIO\b", "BIOLOGY", name)
    name = re.sub(r"BIOPHYS\b", "BIOPHYSICS", name)

    return name


course_titles: Dict[str, int] = {}

for year in range(2015, 2023):
    for plans in major_plans(year).values():
        for college in plans.colleges:
            for course in plans.plan(college):
                title = clean_course_name(course.raw.course_title)
                if title not in course_titles:
                    course_titles[title] = 0
                course_titles[title] += 1

for title in sorted(course_titles.keys()):
    print(f"({course_titles[title]})".rjust(7) + " " + title)
print(f"{len(course_titles)} course names")
