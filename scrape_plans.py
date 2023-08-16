import json
from typing import Any, Hashable, List, Literal, Optional, TypedDict
from urllib.parse import urlencode
from urllib.request import Request, urlopen


HOST = "https://plans.ucsd.edu/controller.php?"


class PlanDepartment(TypedDict):
    code: str
    description: str
    "Same as `code`."
    name: str


class PlanCollege(TypedDict):
    code: str
    name: str


class LoadSearchControlsResponse(TypedDict):
    years: List[int]
    departments: List[PlanDepartment]
    "Alphabetized by name rather than code."
    colleges: List[PlanCollege]
    "Ordered by founding date."


class PlanMajor(TypedDict):
    major: str
    """
    Of the format `<name>* (<code>)`. If `*` is omitted, then `major_code` is
    `NONE`.
    """
    major_code: str
    "`NONE` if plan is not available."


LoadMajorsResponse = List[PlanMajor]


class PlanCourse(TypedDict):
    course_id: int
    plan_id: int
    course_name: str
    units: str
    "A float represented as a string, eg `4.0`."
    course_type: Literal["COLLEGE", "DEPARTMENT"]
    year_taken: int
    quarter_taken: int
    display_order: int
    ge_major_overlap: bool


class PlanComment(TypedDict):
    comment_id: int
    plan_id: int
    author: str
    comment_text: str
    "HTML."
    comment_type: Literal["COLLEGE", "DEPARTMENT"]
    last_modified: str
    "Format: `YYYY-MM-DD HH:MM:SS`. Probably in Pacific Time."


class LoadPlanResponse(TypedDict):
    planId: int
    courses: List[List[List[PlanCourse]]]
    comments: List[PlanComment]
    college_code: str
    college_name: str
    college_url: str
    major_code: str
    department: str
    start_year: int
    department_url: str
    "May be `NONE`."
    major_title: str
    finalized_time: str
    "Format: `YYYY-MM-DD HH:MM:SS`. Probably in Pacific Time."
    plan_length: int
    "Number of years in plan."


LoadPlansResponse = List[LoadPlanResponse]


class PlansAPI:
    @staticmethod
    def _request(action: str, **kwargs: Hashable) -> Any:
        with urlopen(
            Request(
                HOST + urlencode({"action": action, **kwargs}),
                headers={"Accept": "application/json"},
            )
        ) as response:
            return json.load(response)

    @staticmethod
    def load_search_controls() -> LoadSearchControlsResponse:
        return PlansAPI._request("LoadSearchControls")

    @staticmethod
    def load_majors(
        year: int, college: str, department: Optional[str] = None
    ) -> LoadMajorsResponse:
        return PlansAPI._request(
            "LoadMajors", year=year, college=college, department=department
        )

    @staticmethod
    def load_plan(plan_id: int) -> LoadPlanResponse:
        return PlansAPI._request("LoadPlan", planId=plan_id)

    @staticmethod
    def load_plans(year: int, major: str, college: str) -> LoadPlansResponse:
        return PlansAPI._request("LoadPlans", year=year, major=major, college=college)


print(PlansAPI.load_plan(11471))
