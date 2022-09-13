from typing import List
from common_prereqs import parse_int
from parse import Prerequisite, prereqs_raw

Prereqs = List[List[Prerequisite]]


all_prereqs = prereqs_raw()
course_codes = sorted(
    {course for courses in all_prereqs.values() for course in courses.keys()},
    key=lambda subject_code: (subject_code.subject, *parse_int(subject_code.number)),
)
term_codes = sorted(all_prereqs.keys())


def compare_prereqs(first: bool, term: str, old: Prereqs, new: Prereqs) -> None:
    """
    `course_code` is None if it has already printed the course header.
    """
    old_only = [req for req in old if req not in new]
    new_only = [req for req in new if req not in old]
    if not old_only and not new_only:
        return
    if first:
        assert not old_only
        assert len(new_only) == len(new)
        if term != term_codes[0]:
            print(f"<p>New in {term}.</p>")
        print('<ul class="changes">')
        for req in new:
            print(
                f'<li class="change-item">{" or ".join(str(alt.course_code) for alt in req)}</li>'
            )
        print("</ul>")
        return
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
    if not new:
        print("<p>All prerequisites were removed.</p>")
    print("</ul>")


def main() -> None:
    for course_code in course_codes:
        prereq_history = [
            (term_code, all_prereqs[term_code].get(course_code) or [])
            for term_code in term_codes
        ]
        first_index = 0
        first_prereqs: Prereqs = []
        prereqs_changed = False
        for i, (_, prereqs) in enumerate(prereq_history):
            if prereqs and not first_prereqs:
                first_index = i
                first_prereqs = prereqs
            if first_prereqs and prereqs != first_prereqs:
                prereqs_changed = True
                break
        if not prereqs_changed:
            continue
        still_exists = len(prereq_history[-1][1]) > 0

        if not still_exists:
            print(f"<details><summary>{course_code} no longer exists</summary>")
        print(f'<h2 id="{"".join(course_code).lower()}">{course_code}</h2>')
        for i, (term_code, prereqs) in enumerate(prereq_history):
            if i < first_index:
                continue
            compare_prereqs(
                i == first_index,
                term_code,
                prereq_history[i - 1][1] if i > 0 else [],
                prereqs,
            )
        if not still_exists:
            print("</details>")


if __name__ == "__main__":
    main()
