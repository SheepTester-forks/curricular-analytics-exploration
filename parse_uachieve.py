"""
Parses the sample uAchieve data extract.

$ python parse_uachieve.py 'files/BI35_Major_With_Courses(BI35_Major_With_Courses).csv'
"""

import csv
import re
from typing import Iterator, Literal, NamedTuple
from parse import prereqs
from parse_defs import CourseCode


class SingleCourse(NamedTuple):
    """
    a single course in the requirement
    """

    course_code: CourseCode


class SelectExactlyOneCourse(NamedTuple):
    """
    an OR group

    MATCHCTL symbols: /, !
    """

    course_codes: list[CourseCode]
    course_codes_hidden: list[CourseCode]

    def get_course_codes(self, include_hidden: bool) -> list[CourseCode]:
        if include_hidden:
            return [*self.course_codes, *self.course_codes_hidden]
        else:
            return self.course_codes


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


CourseRequirement = (
    SingleCourse | SelectExactlyOneCourse | CourseRange | PseudoCourse | Note
)


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
    next_is_hidden = False
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
            last_subreq_id = int(user_seq_no)
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
                    subreq.courses[-1] = SelectExactlyOneCourse(
                        [subreq.courses[-1].course_code], []
                    )
                assert isinstance(subreq.courses[-1], SelectExactlyOneCourse)
                if next_is_hidden:
                    subreq.courses[-1].course_codes_hidden.append(
                        CourseCode.parse(course)
                    )
                else:
                    subreq.courses[-1].course_codes.append(CourseCode.parse(course))
                assert matchctl in ["", "/", "!"]
            case "range":
                assert isinstance(subreq.courses[-1], SingleCourse)
                subreq.courses[-1] = CourseRange(
                    subreq.courses[-1].course_code, CourseCode.parse(course)
                )
                assert (
                    subreq.courses[-1].lower.subject == subreq.courses[-1].upper.subject
                )
                assert matchctl == ""
            case None:
                subreq.courses.append(SingleCourse(CourseCode.parse(course)))
        match matchctl:
            case "/" | "!":
                next_course = "or"
                next_is_hidden = matchctl == "!"
            case ":" | ";":
                next_course = "range"
            case "":
                next_course = None
            case _:
                raise ValueError(f"Unexpected MATCHCTL value {repr(matchctl)}")
    return degree_plans


class SimplifiedSubrequirement(NamedTuple):
    label: str
    min_count: int
    min_units: int
    courses: list[list[CourseCode]]
    """
    List of courses that can satisfy this subrequirement. Only one course from
    each inner list can be used to satisfy the requirement, i.e. the inner lists
    represent an exclusive OR.
    """


class SimplifiedDegreeProgram(NamedTuple):
    name: str
    subreqs: list[list[SimplifiedSubrequirement]]
    """
    List of requirements. Each requirement is a list of alternative
    subrequirements, i.e. only one subrequirements in this inner list needs to
    be satisfied.
    """

    def display(self) -> str:
        return f"[{self.name}]\n" + "\n".join(
            f"{i}. "
            + (f"\n{" " * (len(f"{i}. ") - 3)}OR ").join(
                f"{subreq_alt.label} (pick {subreq_alt.min_count or f'{subreq_alt.min_units} units'})"
                + (f": {available}" if available else "")
                + (", and" if available and eithers else "")
                + eithers
                for subreq_alt in subreq_alts
                for available in [
                    ", ".join(
                        str(req[0]) for req in subreq_alt.courses if len(req) == 1
                    )
                ]
                for eithers in [
                    "".join(
                        f"\n{" " * len(f"{i}. ")}- Either " + " or ".join(map(str, req))
                        for req in subreq_alt.courses
                        if len(req) > 1
                    )
                ]
            )
            for i, subreq_alts in enumerate(self.subreqs, start=1)
        )


def simplify(
    course_list: list[CourseCode], program: DegreeProgram, include_hidden: bool = True
) -> SimplifiedDegreeProgram:
    def simplify_requirement(req: CourseRequirement) -> list[list[CourseCode]]:
        match req:
            case SingleCourse():
                subject = req.course_code.subject.replace("*", ".")
                return [
                    [course_code]
                    for course_code in course_list
                    if re.fullmatch(subject, course_code.subject)
                    and course_code.number == req.course_code.number.rstrip("#")
                ]
            case SelectExactlyOneCourse():
                course_codes = [
                    CourseCode(course_code.subject, course_code.number.rstrip("#"))
                    for course_code in req.get_course_codes(include_hidden)
                ]
                return [
                    [
                        course_code
                        for course_code in course_list
                        if course_code in course_codes
                    ]
                ]
            case CourseRange():
                subject = req.lower.subject.replace("*", ".")
                lower = req.lower.parts()[1:]
                upper = req.upper.parts()[1:]
                return [
                    [course_code]
                    for course_code in course_list
                    if re.fullmatch(subject, course_code.subject)
                    and lower <= course_code.parts()[1:] <= upper
                ]
            case PseudoCourse():
                # Exclude pseudocourses: Each sub-requirement will have a
                # pseudo-course, designated with a MATCHCTL value of ‘$’ or ‘S’
                # or ‘P’. That should definitely be excluded from a data pull,
                # but also any courses that follow it, as those are hidden from
                # the audit. They typically represent either withdrawn courses
                # (no longer offered) or automatic substitutions.
                return []
            case Note():
                return []

    return SimplifiedDegreeProgram(
        program.id,
        [
            [
                SimplifiedSubrequirement(
                    alt.label,
                    alt.min_count,
                    alt.min_units,
                    [
                        simplified
                        for req in alt.courses
                        for simplified in simplify_requirement(req)
                        if simplified
                    ],
                )
                for alt in subreq
            ]
            for req in program.requirements
            for subreq in req.subrequirements
        ],
    )


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("python parse_uachieve.py <csv>")
        exit(1)

    with open(sys.argv[1]) as f:
        reader = csv.reader(f)
        degree_programs = parse_rows(reader)
    # print(degree_programs[0])
    all_prereqs = prereqs("FA25")
    all_courses = list(all_prereqs.keys())
    print(simplify(all_courses, degree_programs[0], include_hidden=False).display())

    for program in degree_programs:
        simplified = simplify(all_courses, program, include_hidden=True)
        program_courses = {
            course_code
            for subreq in simplified.subreqs
            for subreq_alt in subreq
            for alt in subreq_alt.courses
            for course_code in alt
        }

        # copied from math20c.py
        ld_dependent_count: dict[CourseCode, list[CourseCode]] = {
            course_code: []
            for course_code in program_courses
            if course_code.parts()[1] < 100
        }
        for course_code in program_courses:
            for req in all_prereqs.get(course_code, []):
                for alt in req:
                    if alt.course_code in ld_dependent_count:
                        ld_dependent_count[alt.course_code].append(course_code)
        no_dependents = sorted(
            course
            for course, dependents in ld_dependent_count.items()
            if len(dependents) == 0
        )
        one_dependent = sorted(
            (course, dependents[0])
            for course, dependents in ld_dependent_count.items()
            if len(dependents) == 1
        )
        if no_dependents:
            print(
                f"[{program.id}] Nothing requires {', '.join(str(code) for code in no_dependents)}."
            )
        for prereq, dependent in one_dependent:
            if dependent.parts()[1] >= 100 and prereq.subject == "MATH":
                print(f"[{program.id}] Only {dependent} requires {prereq}.")
