from typing import Dict, List, Literal, NamedTuple, Tuple, Union
from parse import (
    CourseCode,
    Prerequisite,
    plan_rows_to_dict,
    prereq_rows_to_dict,
    prereqs,
    read_csv_from,
)


class ReqCourse(NamedTuple):
    name: str
    matchctl: str


class Requirement(NamedTuple):
    required: Union[Tuple[Literal["count"], int], Tuple[Literal["units"], float]]
    courses: List[ReqCourse]


def parse_uachieve(rows: List[List[str]]) -> Dict[str, Requirement]:
    requirements: Dict[str, Requirement] = {}
    for (
        _,  # DPROG
        _,  # DPFYT
        _,  # INSTIDQ
        _,  # INSTID
        _,  # INSTCD
        _,  # RNAME
        _,  # RQFYT
        _,  # LYT
        _,  # RCONDA
        _,  # CATEGORY
        req_group,  # DARS45_REQ_MAIN_LABEL
        req_name,  # DARS45_SUB_REQ_LABEL
        _,  # CONDA
        count,  # REQCT
        units,  # REQHRS
        _,  # USER_SEQ_NO
        _,  # AR_TYPE
        course,  # COURSE
        matchctl,  # MATCHCTL
    ) in rows:
        requirement = f"{req_group} {req_name}"
        if requirement not in requirements:
            requirements[requirement] = Requirement(
                ("count", int(count)) if count != "0" else ("units", float(units)), []
            )
        requirements[requirement].courses.append(ReqCourse(course, matchctl))
    return requirements


be25fi_uachieve = parse_uachieve(
    read_csv_from(
        "./files/uAchieve Data Mining of Encoding.xlsx - ERCBE25X_Requirements_Using_Sys.csv",
    )[1:]
)


prereqs_fa12 = prereq_rows_to_dict(
    [
        [subject, number, prereq_id, pre_sub, pre_num, allow_concurrent]
        for (
            _,  # Term Code
            _,  # Term ID
            _,  # Course ID
            subject,  # Course Subject Code
            number,  # Course Number
            prereq_id,  # Prereq Sequence ID
            _,  # Prereq Course ID
            pre_sub,  # Prereq Subject Code
            pre_num,  # Prereq Course Number
            _,  # Prereq Minimum Grade Priority
            _,  # Prereq Minimum Grade
            allow_concurrent,  # Allow concurrent registration
        ) in read_csv_from(
            "./files/prereqs_fa12.csv",
            "There is no `prereqs.csv` file in the files/ folder. See the README for where to download it from.",
            strip=True,
        )[
            1:
        ]
        if prereq_id
    ]
)

Prereqs = Dict[CourseCode, List[List[Prerequisite]]]


# def to_set(prereqs: Dict[CourseCode, List[List[Prerequisite]]]) -> Prereqs:
# return {code: {set(alts) for alts in reqs} for code, reqs in prereqs.items()}


def compare_prereqs(fa21: Prereqs, fa12: Prereqs) -> None:
    for code in fa12.keys():
        if code not in fa21:
            print(f"{' '.join(code)} no longer exists")
    for code, reqs in fa21.items():
        if code in fa12:
            # new = reqs - fa12[code]
            # old = fa12[code] - reqs
            pass
        else:
            print(f"{' '.join(code)} new")


# TODO: Has summer quarters
# major_plans_fa12 = plan_rows_to_dict(
#     read_csv_from(
#         "./files/academic_plans_fa12.csv",
#         "There is no `academic_plans.csv` file in the files/ folder. See the README for where to download it from.",
#         strip=True,
#     )[1:]
# )

if __name__ == "__main__":
    compare_prereqs(prereqs, prereqs_fa12)
