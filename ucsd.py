from itertools import chain
import re
from typing import Dict, List, Optional, Tuple

from parse_defs import CourseCode, ProcessedCourse, RawCourse


ParsedCourseCodes = List[Tuple[Optional[CourseCode], float]]


course_code_overrides: Dict[str, ParsedCourseCodes] = {
    # See #15
    "UD DOMAIN ELECTIVE 1 (IF MATH 180A NOT TAKEN)": [(None, 4)],
    "MATH 11": [(CourseCode("MATH", "11"), 5)],
    "CAT 2": [(CourseCode("CAT", "2"), 6)],
    "CAT 3": [(CourseCode("CAT", "3"), 6)],
    "PHYS 1C": [(CourseCode("PHYS", "1C"), 3)],
    "JAPN 130A": [(CourseCode("JAPN", "130A"), 5)],
    "JAPN 130B": [(CourseCode("JAPN", "130B"), 5)],
    "JAPN 130C": [(CourseCode("JAPN", "130C"), 5)],
    "JWSP 1": [(CourseCode("JWSP", "1"), 5)],
    "JWSP 2": [(CourseCode("JWSP", "2"), 5)],
    "JWSP 3": [(CourseCode("JWSP", "3"), 5)],
}


def parse_course_name(
    name: str,
    units: float,
) -> ParsedCourseCodes:
    """
    Attempts to parse course name strings such as "MATH 10A/20A" into the course
    subject, which Curricular Analytics calls the prefix, and number.

    Returns a tuple of the prefix, number, and either L/X if the course is
    actually two courses and needs to be split as a physics lab or language
    analysis section.

    This function is in its own file because parsing course names from academic
    plans is somewhat complicated.

    Splitting course names is also necessary to get the prerequisites for the
    course.
    """
    # Based on
    # https://github.com/SheepTester-forks/ExploratoryCurricularAnalytics/blob/a9e6d0d7afb74f217b3efb382ed39cdd86fe0559/course_names.py#L13-L37
    if name in course_code_overrides:
        return course_code_overrides[name]
    if name.startswith("ADV CHEM"):
        return [(None, units)]
    name = re.sub(r"DF-?\d - ", "", name)
    match = re.search(
        r"\b([A-Z]{2,4}) ?(\d+[A-Z]{0,2})(?: ?[&/] ?\d?[A-Z]([LX]))?", name
    )
    if match:
        subject, number, has_lab = match.group(1, 2, 3)
        if subject in ["IE", "RR", "OR"]:
            return [(None, units)]
        if has_lab:
            lab_units = 2 if has_lab == "L" else 2.5 if has_lab == "X" else 0
            return [
                (CourseCode(subject, number), units - lab_units),
                (CourseCode(subject, number + has_lab), lab_units),
            ]
        else:
            return [(CourseCode(subject, number), units)]
    return [(None, units)]


# https://stackoverflow.com/a/93029
control_chars = re.escape(
    "".join(map(chr, chain(range(0x00, 0x20), range(0x7F, 0xA0))))
)


def clean_course_title(title: str) -> str:
    """
    Cleans up the course title by removing asterisks and (see note)s.
    """
    title = re.sub(r"[*^~.#+=¹%s]+|<..?>" % control_chars, "", title)
    title = title.strip()
    title = re.sub(r"\s*/\s*(AWPE?|A?ELWR|SDCC)", "", title)
    title = title.upper()
    title = re.sub(r"\s+OR\s+|\s*/\s*", " / ", title)
    title = re.sub(r"-+", " - ", title)
    title = re.sub(r" +", " ", title)
    title = re.sub(
        r" ?\( ?(GE SEE|NOTE|FOR|SEE|REQUIRES|ONLY|OFFERED)[^)]*\)", "", title
    )
    title = re.sub(r"^\d+ ", "", title)
    title = re.sub(r"ELECT?\b", "ELECTIVE", title)
    title = title.replace(" (VIS)", "")
    if title.startswith("NE ELECTIVE "):
        title = re.sub(r"[()]", "", title)
    title = re.sub(r"TECH\b", "TECHNICAL", title)
    title = re.sub(r"REQUIRE\b", "REQUIREMENT", title)
    title = re.sub(r"BIO\b", "BIOLOGY", title)
    title = re.sub(r"BIOPHYS\b", "BIOPHYSICS", title)
    return title


class UCSD:
    # College codes from least to most weird colleges (see #14)
    curriculum_priority = ["TH", "WA", "SN", "MU", "FI", "RE", "SI"]

    @staticmethod
    def process_plan(plan: List[RawCourse]) -> List[ProcessedCourse]:
        courses: List[ProcessedCourse] = []
        for course in plan:
            title = clean_course_title(course.course_title)
            parsed = parse_course_name(title, course.units)
            term = course.year * 4 + course.quarter
            for course_code, units in parsed:
                courses.append(
                    ProcessedCourse(
                        str(course_code) if len(parsed) > 1 else title,
                        course_code,
                        units,
                        course.type == "DEPARTMENT" or course.overlaps_ge,
                        # Move summer sessions to previous quarter, per Carlos'
                        # request. They tend to be GEs says Arturo, so it
                        # shouldn't affect prereqs
                        term - (term + 1) // 4,
                        course,
                    )
                )
        return courses
