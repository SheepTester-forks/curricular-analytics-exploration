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

python3 parse.py <year> # Get a list of major codes to upload with upload.sh
"""

import csv
from typing import Dict, Iterable, List, NamedTuple, Optional, Set, Tuple
from parse_defs import CourseCode, ProcessedCourse, Prerequisite, RawCourse, TermCode
from university import university

__all__ = ["prereqs", "major_plans", "major_codes"]


def prereq_rows_to_dict(
    rows: Iterable[List[str]],
) -> Dict[CourseCode, List[List[Prerequisite]]]:
    """
    Converts prerequisite rows from a CSV to a nested dictionary mapping from a
    term code (e.g. FA12) to a course code to its prerequisites.

    The dictionary values are lists of lists. The outer list is a list of
    requirements, like an AND, while each inner list is a list of possible
    courses to satisfy the requirement, like an OR.
    """
    courses: Dict[CourseCode, List[List[Prerequisite]]] = {}
    for (
        _,  # Term Code
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
        course = CourseCode(subject.strip(), number.strip())
        prereq = Prerequisite(
            CourseCode(req_subj.strip(), req_num.strip()), allow_concurrent == "Y"
        )
        if course not in courses:
            courses[course] = []
        if req_id == "":
            continue
        index = int(req_id) - 1
        while len(courses[course]) <= index:
            courses[course].append([])
        # Could probably include the allow concurrent registration info here
        courses[course][index].append(prereq)
    return courses


_term_cache: Optional[List[TermCode]] = None


def terms() -> List[TermCode]:
    global _term_cache
    if not _term_cache:
        terms: Set[TermCode] = set()
        with open(university.prereqs_file, newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for term, *_ in reader:
                terms.add(TermCode(term))
        _term_cache = sorted(terms)
    return _term_cache


_prereq_cache: Dict[TermCode, Dict[CourseCode, List[List[Prerequisite]]]] = {}


def prereqs(term: str) -> Dict[CourseCode, List[List[Prerequisite]]]:
    global _prereq_cache
    term = TermCode(term)
    if term < terms()[0]:
        term = terms()[0]
    elif term > terms()[-1]:
        term = terms()[-1]
    if term not in _prereq_cache:
        with open(university.prereqs_file, newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            _prereq_cache[term] = prereq_rows_to_dict(
                row for row in reader if row[0] == term
            )
        university.fix_prereqs(_prereq_cache[term], term)
    return _prereq_cache[term]


class MajorPlans:
    """
    Represents a major's set of academic plans. Contains plans for each college.

    To get the plan for a specific college, use the two-letter college code. For
    example, `plan("FI")` contains the academic plan for ERC (Fifth College).
    """

    year: int
    # TODO: MajorPlan.department vs MajorInfo.department
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
            if university.keep_plan(self.year, college_code):
                self.colleges.add(college_code)
            self.raw_plans[college_code] = []
        self.raw_plans[college_code].append(course)

    def plan(self, college: str) -> List[ProcessedCourse]:
        if college not in self._parsed_plans:
            self._parsed_plans[college] = university.process_plan(
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
            for college_code in university.curriculum_priority:
                if college_code in self.colleges:
                    college = college_code
                    break
            if college is None:
                # Use an arbitrary college as the base if there is one (for
                # non-UCSD plans)
                college = next(iter(self.colleges))
        return [course for course in self.plan(college) if course.for_major]


def plan_rows_to_dict(rows: Iterable[List[str]]) -> Dict[str, MajorPlans]:
    """
    Converts the academic plans CSV rows into a dictionary of major codes to
    `Major` objects.
    """
    plans: Dict[str, MajorPlans] = {}
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
        *_,  # Term Taken, Plan Length
    ) in rows:
        year = int(year)
        if major_code not in plans:
            plans[major_code] = MajorPlans(year, department, major_code)
        if course_type != "COLLEGE" and course_type != "DEPARTMENT":
            raise TypeError('Course type is neither "COLLEGE" nor "DEPARTMENT"')
        plans[major_code].add_raw_course(
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
    return plans


_plan_cache: Dict[Tuple[int, int], Dict[str, MajorPlans]] = {}


def major_plans(year: int, length: int = 4) -> Dict[str, MajorPlans]:
    global _major_plans
    if (year, length) not in _plan_cache:
        with open(university.plans_file, newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            _plan_cache[year, length] = plan_rows_to_dict(
                row
                for row in reader
                if int(row[7]) == year
                # Default plan length is 4
                and (int(row[11]) if len(row) > 11 else 4) == length
            )
    return _plan_cache[year, length]


class MajorInfo(NamedTuple):
    """
    Represents information about a major from the ISIS major code list.

    You can find the major code list by Googling "isis major codes," but it's
    not going to be in the format that this program expects:
    https://blink.ucsd.edu/_files/instructors-tab/major-codes/isis_major_code_list.xlsx
    """

    isis_code: str
    name: str
    # TODO: MajorPlan.department vs MajorInfo.department
    department: str
    cip_code: str
    award_types: Set[str]


def major_rows_to_dict(rows: Iterable[List[str]]) -> Dict[str, MajorInfo]:
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
        majors[isis_code.strip()] = MajorInfo(
            isis_code.strip(),
            title.strip(),
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
        with open(university.majors_file, newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            _major_codes = major_rows_to_dict(reader)
    return _major_codes


if __name__ == "__main__":
    import sys

    print(" ".join(major_plans(int(sys.argv[1])).keys()))
