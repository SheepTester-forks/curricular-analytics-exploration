from typing import List

from parse import RawCourse, major_plans


def diff(old: List[RawCourse], new: List[RawCourse]):
    old_only = [course for course in old if course not in new]
    new_only = [course for course in new if course not in old]
    print(old_only)
    print(new_only)


diff(
    major_plans(2020)["BE25"].raw_plans["RE"], major_plans(2021)["BE25"].raw_plans["RE"]
)
