from typing import Dict, List, Literal, NamedTuple, Tuple, Union
from parse import read_csv_from


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

if __name__ == "__main__":
    print(be25fi_uachieve)
