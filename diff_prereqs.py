from typing import List, Optional
from common_prereqs import parse_int
from parse import CourseCode, Prerequisite, prereqs_raw

Prereqs = List[List[Prerequisite]]


all_prereqs = prereqs_raw()
course_codes = sorted(
    {course for courses in all_prereqs.values() for course in courses.keys()},
    key=lambda subject_code: (subject_code.subject, *parse_int(subject_code.number)),
)
term_codes = sorted(all_prereqs.keys())


def compare_prereqs(
    course_code: Optional[CourseCode], term: str, old: Prereqs, new: Prereqs
) -> bool:
    old_only = [req for req in old if req not in new]
    new_only = [req for req in new if req not in old]
    if not old_only and not new_only:
        return False
    if course_code:
        assert not old_only
        assert len(new_only) == len(new)
        print(f"<h2>{course_code}</h2>")
    if term == term_codes[0]:
        print('<ul class="changes">')
        for req in new:
            print(
                f'<li class="change-item">{" or ".join(str(alt.course_code) for alt in req)}</li>'
            )
        print("</ul>")
        return True
    print(f"<h3>{term} changes</h3>")
    print('<ul class="changes">')
    for req in old_only:
        print(
            f'<li class="change-item removed">{" or ".join(str(alt.course_code) for alt in req)}</li>'
        )
    for req in new_only:
        print(
            f'<li class="change-item added">{" or ".join(str(alt.course_code) for alt in req)}</li>'
        )
    print("</ul>")
    return True


def main() -> None:
    for course_code in course_codes:
        prev_prereqs: Prereqs = []
        printed = False
        for term_code in term_codes:
            prereqs = all_prereqs[term_code].get(course_code) or []
            printed = compare_prereqs(
                None if printed else course_code, term_code, prev_prereqs, prereqs
            )
            prev_prereqs = prereqs


if __name__ == "__main__":
    main()
