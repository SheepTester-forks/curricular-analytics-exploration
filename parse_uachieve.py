"""
$ python parse_uachieve.py 'files/BI35_Major_With_Courses(BI35_Major_With_Courses).csv'
"""

import csv
from typing import Iterator, Literal, NamedTuple
from parse_defs import CourseCode


class SingleCourse(NamedTuple):
    """
    a single course in the requirement
    """

    course_code: CourseCode


class SelectOneCourse(NamedTuple):
    """
    an OR group

    MATCHCTL symbols: /, !
    """

    course_codes: list[CourseCode]


class CourseRange(NamedTuple):
    """
    a range of course codes

    MATCHCTL symbols: :, ;
    """

    lower: CourseCode
    upper: CourseCode


class PseudoCourse(NamedTuple):
    """
    like an alias for a group of courses i think

    MATCHCTL symbols: $, P, S
    """

    name: str


class Note(NamedTuple):
    """
    a human-readable note, not really a real requirement

    MATCHCTL symbols: N
    """

    note: str


CourseRequirement = SingleCourse | SelectOneCourse | CourseRange | PseudoCourse | Note


class Subrequirement(NamedTuple):
    label: str
    min_count: int
    min_units: int
    courses: list[CourseRequirement]


class MainRequirement(NamedTuple):
    name: str
    "(DPRNAME)"
    min_subreqs: int
    "minimum number of subrequirements that need to be met (REQSRQ)"
    min_units: int
    "minimum number of units (DARS45_REQ_MAIN_REQHRS)"
    subrequirements: list[list[Subrequirement]]
    "within each list, just one subrequirement needs to be met (similar to prereqs)"


class DegreeProgram(NamedTuple):
    id: str
    "(DPROG)"
    requirements: list[MainRequirement]


def parse_rows(rows: Iterator[list[str]]) -> list[DegreeProgram]:
    next(rows)
    degree_plans: list[DegreeProgram] = []
    last_subreq_id = 0
    next_subseq_is_or = False
    next_course: Literal["or", "range"] | None = None
    for (
        dprog,
        dprname,
        reqsrq,
        dars45_req_main_reqhrs,
        user_seq_no,
        label,
        sreqor,  # 'T' if it's an OR between subsequences, else empty or 'F'
        reqct,
        dars45_sub_req_reqhrs,
        reqflg,
        ar_type,
        course,
        matchctl,
    ) in rows:
        assert sreqor in ["", "T", "F"]
        assert matchctl in ["", "/", "!", ":", ";", "$", "P", "S", "N"]
        assert reqflg == ""
        assert ar_type == "A"

        if not degree_plans or degree_plans[-1].id != dprog:
            degree_plans.append(DegreeProgram(dprog, []))
        if (
            not degree_plans[-1].requirements
            or degree_plans[-1].requirements[-1].name != dprname
        ):
            degree_plans[-1].requirements.append(
                MainRequirement(dprname, int(reqsrq), int(dars45_req_main_reqhrs), [])
            )
            last_subreq_id = 0
        if last_subreq_id != int(user_seq_no):
            new_subreq = Subrequirement(
                label, int(reqct), int(dars45_sub_req_reqhrs), []
            )
            if next_subseq_is_or:
                degree_plans[-1].requirements[-1].subrequirements[-1].append(new_subreq)
            else:
                degree_plans[-1].requirements[-1].subrequirements.append([new_subreq])
            next_course = None
        next_subseq_is_or = sreqor == "T"
        subreq = degree_plans[-1].requirements[-1].subrequirements[-1][-1]

        if matchctl in ["$", "P", "S"]:
            subreq.courses.append(PseudoCourse(course))
            next_course = None
            continue
        if matchctl == "N":
            subreq.courses.append(Note(course))
            next_course = None
            continue

        match next_course:
            case "or":
                if isinstance(subreq.courses[-1], SingleCourse):
                    subreq.courses[-1] = SelectOneCourse(
                        [subreq.courses[-1].course_code]
                    )
                assert isinstance(subreq.courses[-1], SelectOneCourse)
                subreq.courses[-1].course_codes.append(CourseCode.parse(course))
                assert matchctl in ["", "/", "!"]
            case "range":
                assert isinstance(subreq.courses[-1], SingleCourse)
                subreq.courses[-1] = CourseRange(
                    subreq.courses[-1].course_code, CourseCode.parse(course)
                )
                assert matchctl == ""
            case None:
                subreq.courses.append(SingleCourse(CourseCode.parse(course)))
        match matchctl:
            case "/" | "!":
                next_course = "or"
            case ":" | ";":
                next_course = "range"
            case _:
                next_course = None
    return degree_plans


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("python parse_uachieve.py <csv>")
        exit(1)

    with open(sys.argv[1]) as f:
        reader = csv.reader(f)
        print(parse_rows(reader))
