from typing import List, NamedTuple, Optional, TypeVar
from common_prereqs import parse_int
from parse import CourseCode, Prerequisite, prereqs_raw

Prereqs = List[List[Prerequisite]]

T = TypeVar("T")


def remove_duplicates(ls: List[T]) -> List[T]:
    return [item for i, item in enumerate(ls) if item not in ls[0:i]]


all_prereqs = prereqs_raw()
course_codes = sorted(
    {course for courses in all_prereqs.values() for course in courses.keys()},
    key=lambda subject_code: (subject_code.subject, *parse_int(subject_code.number)),
)
term_codes = sorted(all_prereqs.keys())


def find_requirement_with_course(
    prereqs: Prereqs, course_code: CourseCode
) -> Optional[List[Prerequisite]]:
    for requirement in prereqs:
        for course, _ in requirement:
            if course == course_code:
                return requirement


class Change(NamedTuple):
    unchanged: List[Prerequisite]
    flipped_concurrent: List[Prerequisite]
    removed: List[Prerequisite]
    added: List[Prerequisite]


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
            print(f"<p>New in {term}. Originally:</p>")
        else:
            print("<p>Originally:</p>")
        print('<ul class="changes">')
        for req in new:
            print(
                f'<li class="change-item">{" or ".join(str(alt.course_code) for alt in req)}</li>'
            )
        print("</ul>")
        return

    changes: List[Change] = []
    for old_req in old_only[:]:
        for course, _ in old_req:
            new_req = find_requirement_with_course(new_only, course)
            if not new_req:
                continue
            old_only.remove(old_req)
            new_only.remove(new_req)

            old_req = old_req.copy()
            new_req = new_req.copy()
            unchanged: List[Prerequisite] = []
            flipped_concurrent: List[Prerequisite] = []
            for prereq in old_req[:]:
                if prereq in new_req:
                    old_req.remove(prereq)
                    new_req.remove(prereq)
                    unchanged.append(prereq)
                    continue
                for new_prereq in new_req:
                    if new_prereq.course_code == prereq.course_code:
                        old_req.remove(prereq)
                        new_req.remove(new_prereq)
                        flipped_concurrent.append(new_prereq)
                        break
            changes.append(Change(unchanged, flipped_concurrent, old_req, new_req))
            break

    print(f"<h3>{term} changes</h3>")
    print('<ul class="changes">')
    for req in old_only:
        print(
            f'<li class="change-item removed">{" or ".join(str(alt.course_code) for alt in req)}</li>'
        )
    for unchanged, flipped_concurrent, removed, added in changes:
        items = " or ".join(
            [str(course) for course, _ in unchanged]
            + [
                f'{course} (<span class="change">{"now" if allow_concurrent else "no longer"}</span> allows concurrent)'
                for course, allow_concurrent in flipped_concurrent
            ]
        )
        if added:
            if items:
                items += " or "
            items += f'<span class="added">{" or ".join(str(course) for course, _ in added)}</span>'
        if removed:
            if items:
                items += " · removed: "
            items += f'<span class="removed">{", ".join(str(course) for course, _ in removed)}</span>'
        print(f'<li class="change-item changed">{items}</li>')
    for req in new_only:
        print(
            f'<li class="change-item added">{" or ".join(str(alt.course_code) for alt in req)}</li>'
        )
    print("</ul>")
    if not new:
        print("<p>All prerequisites were removed.</p>")


def main() -> None:
    for course_code in course_codes:
        prereq_history = [
            (
                term_code,
                remove_duplicates(
                    [
                        remove_duplicates(req)
                        for req in all_prereqs[term_code].get(course_code) or []
                        if req
                    ]
                ),
            )
            for term_code in term_codes
            # Ignore special and medical summer, which seems to often omit
            # prereqs only for them to be readded in fall
            if term_code.quarter() != "S3" and term_code.quarter() != "SU"
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
