from itertools import chain
import re
from typing import Dict, List, Optional, Set, Tuple

from parse_defs import CourseCode, Prerequisite, ProcessedCourse, RawCourse, TermCode

__all__ = ["university"]


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
non_subjects: Set[str] = {"IE", "RR", "OR", "TE", "DEPT"}


def parse_course_name(
    name: str,
    units: float,
) -> ParsedCourseCodes:
    """
    Attempts to parse course name strings such as "MATH 10A/20A" into the course
    subject, which Curricular Analytics calls the prefix, and number. `name`
    should be passed through `clean_course_title` first.

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
        if subject in non_subjects:
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


class _UCSD:
    name = "University of California, San Diego"
    term_type = "Quarter"
    terms = ["FA", "WI", "SP"]
    "Used for mapping term indices to term codes"

    prereqs_file = "./files/prereqs_fa12.csv"
    plans_file = "./files/plans_all.csv"
    majors_file = "./files/isis_major_code_list.xlsx - Major Codes.csv"

    curriculum_priority = ["TH", "WA", "SN", "MU", "FI", "RE", "SI"]
    "College codes from least to most weird colleges (see #14)"
    college_codes = ["RE", "MU", "TH", "WA", "FI", "SI", "SN"]
    "Defines the display order of colleges"
    college_names = {
        "RE": "Revelle",
        "MU": "Muir",
        "TH": "Marshall",
        "WA": "Warren",
        "FI": "ERC",
        "SI": "Sixth",
        "SN": "Seventh",
    }

    # Prerequisites for courses without course codes
    non_course_prereqs: Dict[str, List[List[Prerequisite]]] = {
        "SOCI- UD METHODOLOGY": [[Prerequisite(CourseCode("SOCI", "60"), False)]],
        "TDHD XXX": [[Prerequisite(CourseCode("TDTR", "10"), False)]],
    }

    def keep_plan(self, start_year: int, college: str) -> bool:
        # Seventh's 2018 plans are messy (and the 2019 ones don't exist), so
        # Carlos wants us to ignore them
        return not (college == "SN" and start_year < 2020)

    def process_plan(self, plan: List[RawCourse]) -> List[ProcessedCourse]:
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

    def fix_prereqs(
        self, prereqs: Dict[CourseCode, List[List[Prerequisite]]], term: TermCode
    ) -> None:
        # Fix possible errors in prereqs (#52)
        prereqs[CourseCode("NANO", "102")] = [
            [Prerequisite(CourseCode("CHEM", "6C"), False)]
        ]
        prereqs[CourseCode("DOC", "2")] = [
            [Prerequisite(CourseCode("DOC", "1"), False)]
        ]
        # Math 18 has no prereqs because it only requires pre-calc, which we
        # assume the student has credit for
        prereqs[CourseCode("MATH", "18")] = []

    def get_term(self, term_index: int) -> Tuple[int, int]:
        term_count = len(self.terms)
        return term_index // term_count, term_index % term_count

    def get_term_code(self, start_year: int, term_index: int) -> TermCode:
        year, term = self.get_term(term_index)
        return TermCode(self.terms[term] + f"{(start_year + year) % 100:02d}")

    def quarter_name(self, quarter: int) -> str:
        return ["FA", "WI", "SP", "SU"][quarter]


university = _UCSD()
