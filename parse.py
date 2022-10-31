"""
Parses the prerequisite and academic plan CSV files into objects for easier
manipulation.

Exports:
    `prereqs`, a dictionary mapping from a subject code-number tuple to a list
    of prerequisites, which are each lists of possible course codes to satisfy
    the requirement.

    `major_plans`, a dictionary mapping from ISIS major codes to `MajorPlans`
    objects, which contains a dictionary mapping college codes to `Plan`s, which
    have a list of list of `PlannedCourse`s for each quarter.

    `major_codes`, a dictionary mapping from ISIS major codes to `MajorInfo`
    objects, which contains data from the ISIS major codes spreadsheet.
"""

from csv import reader
from typing import Dict, List, NamedTuple, Optional, Set
from parse_defs import CourseCode, ProcessedCourse, Prerequisite, RawCourse, TermCode

from ucsd import UCSD

__all__ = ["prereqs", "major_plans", "major_codes"]


def read_csv_from(
    path: str, not_found_msg: Optional[str] = None, strip: bool = False
) -> List[List[str]]:
    """
    Reads and parses the file at the given path as a CSV file.

    The CSV parser doesn't validate the CSV, so it's kind of dumb, but I don't
    think much cleverness is needed for parsing these fairly tame CSV files.
    There is support for quoted fields and rudimentary support for backslashes
    (they won't break, but they're currently not interpreted, so `\\"` remains
    in the field value).

    This function returns a list of records (rows), each containing the fields
    of the record. Quoted fields have their double quotes removed.

    Since I gitignored the CSV files, I'm using `not_found_msg` to give more
    helpful error messages in case someone running this code hasn't put the
    necessary CSV files in files/ folder.

    Set `strip` to true to remove whitespace padding from record fields.
    """
    try:
        with open(path, "r", newline="") as file:
            rows = list(reader(file))
    except FileNotFoundError as e:
        raise e if not_found_msg is None else FileNotFoundError(not_found_msg)
    return rows


def prereq_rows_to_dict(
    rows: List[List[str]],
) -> Dict[TermCode, Dict[CourseCode, List[List[Prerequisite]]]]:
    """
    Converts prerequisite rows from a CSV to a nested dictionary mapping from a
    term code (e.g. FA12) to a course code to its prerequisites.

    The dictionary values are lists of lists. The outer list is a list of
    requirements, like an AND, while each inner list is a list of possible
    courses to satisfy the requirement, like an OR.
    """
    terms: Dict[TermCode, Dict[CourseCode, List[List[Prerequisite]]]] = {}
    for (
        term,  # Term Code
        _,  # Term ID
        _,  # Course ID
        subject,  # Course Subject Code
        number,  # Course Number
        req_id,  # Prereq Sequence ID
        _,  # Prereq Course ID
        req_subj,  # Prereq Subject Code
        req_num,  # Prereq Course Number
        _,  # Prereq Minimum Grade Priority
        _,  # Prereq Minimum Grade
        allow_concurrent,  # Allow concurrent registration
    ) in rows:
        term = TermCode(term)
        if term not in terms:
            terms[term] = {}
        course = CourseCode(subject, number)
        prereq = Prerequisite(CourseCode(req_subj, req_num), allow_concurrent == "Y")
        if course not in terms[term]:
            terms[term][course] = []
        if req_id == "":
            continue
        index = int(req_id) - 1
        while len(terms[term][course]) <= index:
            terms[term][course].append([])
        # Could probably include the allow concurrent registration info here
        terms[term][course][index].append(prereq)
    return terms


_prereqs: Optional[Dict[TermCode, Dict[CourseCode, List[List[Prerequisite]]]]] = None


def prereqs(term: str) -> Dict[CourseCode, List[List[Prerequisite]]]:
    global _prereqs
    if _prereqs is None:
        _prereqs = prereq_rows_to_dict(
            read_csv_from(
                "./files/prereqs_fa12.csv",
                "There is no `prereqs_fa12.csv` file in the files/ folder. See the README for where to download it from.",
                strip=True,
            )[1:]
        )
        # Fix possible errors in prereqs (#52)
        for term_prereqs in _prereqs.values():
            term_prereqs[CourseCode("NANO", "102")] = [
                [Prerequisite(CourseCode("CHEM", "6C"), False)]
            ]
            term_prereqs[CourseCode("DOC", "2")] = [
                [Prerequisite(CourseCode("DOC", "1"), False)]
            ]
    term = TermCode(term)
    if term not in _prereqs:
        first_term = min(_prereqs.keys())
        if term < first_term:
            term = first_term
        else:
            term = max(_prereqs.keys())
    return _prereqs[term]


def prereqs_raw() -> Dict[TermCode, Dict[CourseCode, List[List[Prerequisite]]]]:
    prereqs("FA21")  # cache _prereqs
    return _prereqs or {}


class MajorPlans:
    """
    Represents a major's set of academic plans. Contains plans for each college.

    To get the plan for a specific college, use the two-letter college code. For
    example, `plan("FI")` contains the academic plan for ERC (Fifth College).
    """

    university = UCSD

    year: int
    department: str
    major_code: str
    colleges: Set[str]
    raw_plans: Dict[str, List[RawCourse]]
    _parsed_plans: Dict[str, List[ProcessedCourse]]

    def __init__(self, year: int, department: str, major_code: str) -> None:
        self.year = year
        self.department = department
        self.major_code = major_code
        self.colleges = set()
        self.raw_plans = {}
        self._parsed_plans = {}

    def add_raw_course(self, college_code: str, course: RawCourse) -> None:
        if college_code not in self.colleges:
            self.colleges.add(college_code)
            self.raw_plans[college_code] = []
        self.raw_plans[college_code].append(course)

    def plan(self, college: str) -> List[ProcessedCourse]:
        if college not in self._parsed_plans:
            self._parsed_plans[college] = self.university.process_plan(
                self.raw_plans[college]
            )
        return self._parsed_plans[college]

    def curriculum(self, college: Optional[str] = None) -> List[ProcessedCourse]:
        """
        Returns a list of courses based on the specified college's degree plan
        with college-specific courses removed. Can be used to create a
        curriculum for Curricular Analytics.

        Two curricula are equivalent if they have the same of each number of
        course, regardless of the order. However, there can be multiple
        identical courses (eg "ELECTIVE"), so this method does not return a set.

        The `overlaps_ge` attribute for these courses should be ignored (because
        there is no college whose GEs the course overlaps with).

        If no college is specified, it will try Marshall (Third College) by
        default because it appears to be a generally good college to base
        curricula off of (see #14). If there is no Marshall plan, it will try a
        different college.
        """
        if college is None:
            for college_code in self.university.curriculum_priority:
                if college_code in self.colleges:
                    college = college_code
                    break
            if college is None:
                # Support non-UCSD plans; uses an arbitrary college as the base
                college = next(iter(self.colleges))
        return [course for course in self.plan(college) if course.for_major]


def plan_rows_to_dict(rows: List[List[str]]) -> Dict[int, Dict[str, MajorPlans]]:
    """
    Converts the academic plans CSV rows into a dictionary of major codes to
    `Major` objects.
    """
    years: Dict[int, Dict[str, MajorPlans]] = {}
    for (
        department,  # Department
        major_code,  # Major
        college_code,  # College
        course_title,  # Course
        units,  # Units
        course_type,  # Course Type
        overlap,  # GE/Major Overlap
        year,  # Start Year
        plan_yr,  # Year Taken
        plan_qtr,  # Quarter Taken
        _,  # Term Taken
    ) in rows:
        year = int(year)
        if year not in years:
            years[year] = {}
        if major_code not in years[year]:
            years[year][major_code] = MajorPlans(year, department, major_code)
        if course_type != "COLLEGE" and course_type != "DEPARTMENT":
            raise TypeError('Course type is neither "COLLEGE" nor "DEPARTMENT"')
        years[year][major_code].add_raw_course(
            college_code,
            RawCourse(
                course_title,
                float(units),
                course_type,
                overlap == "Y",
                int(plan_yr) - 1,
                int(plan_qtr) - 1,
            ),
        )
    return years


_major_plans: Optional[Dict[int, Dict[str, MajorPlans]]] = None


def major_plans(year: int) -> Dict[str, MajorPlans]:
    global _major_plans
    if _major_plans is None:
        _major_plans = plan_rows_to_dict(
            read_csv_from(
                "./files/academic_plans_fa12.csv",
                "There is no `academic_plans_fa12.csv` file in the files/ folder. See the README for where to download it from.",
                strip=True,
            )[1:]
        )
    return _major_plans[year]


class MajorInfo(NamedTuple):
    """
    Represents information about a major from the ISIS major code list.

    You can find the major code list by Googling "isis major codes," but it's
    not going to be in the format that this program expects:
    https://blink.ucsd.edu/_files/instructors-tab/major-codes/isis_major_code_list.xlsx
    """

    isis_code: str
    name: str
    department: str
    cip_code: str
    award_types: Set[str]


def major_rows_to_dict(rows: List[List[str]]) -> Dict[str, MajorInfo]:
    majors: Dict[str, MajorInfo] = {}
    for (
        _,  # Previous Local Code
        _,  # UCOP Major Code (CSS)
        isis_code,  # ISIS Major Code
        _,  # Major Abbreviation
        _,  # Major Description
        title,  # Diploma Title
        _,  # Start Term
        _,  # End Term
        _,  # Student Level
        department,  # Department
        award_types,  # Award Type
        _,  # Program Length (in years)
        _,  # College
        cip_code,  # CIP Code
        _,  # CIP Description
        _,  # STEM
        _,  # Self Supporting
        _,  # Discontinued or Phasing Out
        _,  # Notes
    ) in rows:
        majors[isis_code] = MajorInfo(
            isis_code,
            title,
            department,
            cip_code[0:2] + "." + cip_code[2:],
            set(award_types.split(" "))
            if award_types and award_types != "NONE"
            else set(),
        )
    return majors


_major_codes: Optional[Dict[str, MajorInfo]] = None


def major_codes():
    global _major_codes
    if _major_codes is None:
        _major_codes = major_rows_to_dict(
            read_csv_from(
                "./files/isis_major_code_list.xlsx - Major Codes.csv",
                "There is no `isis_major_code_list.xlsx - Major Codes.csv` file in the files/ folder. See the README for where to download it from.",
                strip=True,
            )[1:]
        )
    return _major_codes


if __name__ == "__main__":
    print(
        next(
            course
            for course in major_plans(2022)["MC25"].plan("RE")
            if "PHYS 2C" in course.course_title
        )
    )
