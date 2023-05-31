from typing import List, Literal, Optional, TypedDict


# Common


class Requisite(TypedDict):
    source_id: int
    target_id: int
    type: Literal["prereq", "coreq", "strict-coreq"]


# Request


class CurriculumItem(TypedDict):
    name: str
    id: int
    credits: float
    curriculum_requisites: List[Requisite]


class Term(TypedDict):
    id: int
    curriculum_items: List[CurriculumItem]


class Curriculum(TypedDict):
    curriculum_terms: List[Term]


class DegreePlan(TypedDict):
    id: int


class VisUpdateCurriculum(TypedDict):
    curriculum: Curriculum


class VisUpdateDegreePlan(TypedDict):
    """
    Sent to /degree_plans/viz_update/
    """

    curriculum: Curriculum
    degree_plan: DegreePlan


# Response


class _ResponseCourse(TypedDict):
    id: int
    name: str
    prefix: Optional[str]
    num: Optional[str]
    credits: float
    requisites: List[Requisite]
    nameCanonical: Optional[str]
    nameSub: Optional[str]
    annotation: Optional[str]


class _ResponseTerm(TypedDict):
    id: int
    name: str
    items: List[_ResponseCourse]


class VisCurriculum(TypedDict):
    """
    Returned by /vis_curriculum_hash/
    """

    courses: List[_ResponseCourse]
    name: str
    system_type: Literal["quarter", "semester"]


class VisDegreePlan(TypedDict):
    """
    Returned by /vis_degree_plan_hash/
    """

    terms: List[_ResponseTerm]
    system_type: Literal["quarter", "semester"]
