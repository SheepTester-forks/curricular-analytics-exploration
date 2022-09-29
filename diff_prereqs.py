from typing import List, NamedTuple, Optional, Tuple, TypeVar
from common_prereqs import parse_int
from parse import CourseCode, Prerequisite, TermCode, prereqs_raw

Prereqs = List[List[Prerequisite]]

T = TypeVar("T")


def remove_duplicates(ls: List[T]) -> List[T]:
    return [item for i, item in enumerate(ls) if item not in ls[0:i]]


all_prereqs = prereqs_raw()
course_codes = sorted(
    {course for courses in all_prereqs.values() for course in courses.keys()},
    key=lambda subject_code: (subject_code.subject, *parse_int(subject_code.number)),
)
# Ignore special and medical summer, which seems to often omit prereqs only for
# them to be readded in fall
term_codes = sorted(
    term_code
    for term_code in all_prereqs.keys()
    if term_code.quarter() != "S3" and term_code.quarter() != "SU"
)


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


class Diff(NamedTuple):
    term: TermCode
    added: Prereqs
    removed: Prereqs
    changes: List[Change]
    req_count: int


def diff_prereqs(term: TermCode, old: Prereqs, new: Prereqs) -> Optional[Diff]:
    old_only = [req for req in old if req not in new]
    new_only = [req for req in new if req not in old]
    if not old_only and not new_only:
        return None

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
    return Diff(term, new_only, old_only, changes, len(new))


class History(NamedTuple):
    course_code: CourseCode
    has_changed: bool
    prereq_history: List[Tuple[TermCode, Prereqs]] = []
    diffs: List[Diff] = []
    still_exists: bool = False


def get_history(course_code: CourseCode) -> History:
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
    ]
    diffs: List[Diff] = []
    for i, (term_code, prereqs) in enumerate(prereq_history):
        diff = diff_prereqs(
            term_code,
            prereq_history[i - 1][1] if i > 0 else [],
            prereqs,
        )
        if diff:
            diffs.append(diff)
    if len(diffs) <= 1:
        return History(course_code, False)
    still_exists = len(prereq_history[-1][1]) > 0
    return History(course_code, True, prereq_history, diffs, still_exists)


def get_changed_courses() -> List[History]:
    return [get_history(course_code) for course_code in course_codes]


def compare_prereqs(course_id: str, first: bool, diff: Diff) -> None:
    if first:
        if diff.term != term_codes[0]:
            print(f"<p>New in {diff.term}. Originally:</p>")
        else:
            print("<p>Originally:</p>")
        print('<ul class="changes">')
        for req in diff.added:
            print(
                f'<li class="change-item">{" or ".join(str(alt.course_code) for alt in req)}</li>'
            )
        print("</ul>")
        return

    print(f'<h3 id="{course_id}-{diff.term.lower()}">{diff.term} changes</h3>')
    print('<ul class="changes">')
    for req in diff.removed:
        print(
            f'<li class="change-item removed">{" or ".join(str(alt.course_code) for alt in req)}</li>'
        )
    for unchanged, flipped_concurrent, removed, added in diff.changes:
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
    for req in diff.added:
        print(
            f'<li class="change-item added">{" or ".join(str(alt.course_code) for alt in req)}</li>'
        )
    print("</ul>")
    if diff.req_count == 0:
        print("<p>All prerequisites were removed.</p>")


def print_diff() -> None:
    changed_courses = get_changed_courses()

    print("<body>")
    print('<nav class="sidebar">')
    prev_subj = ""
    for course_code, has_changed, *_, still_exists in changed_courses:
        if course_code.subject != prev_subj:
            if prev_subj:
                print("</ul></details>")
            print(f"<details><summary>{course_code.subject}</summary><ul>")
            prev_subj = course_code.subject
        if has_changed:
            print(
                f'<li><a href="#{"".join(course_code).lower()}">{course_code}</a></li>'
            )
        else:
            print(f'<li title="Prerequisites have not changed.">{course_code}</li>')
    print("</ul></details>")
    print('<a href="#" class="top-link">↑ Back to top</a>')
    print("</nav>")

    print('<main class="main">')
    print("<h1>Changes made to course prerequisites over time</h1>")
    print(
        "<p>Only courses whose prerequisites have changed are shown. Most courses that no longer have prerequisites no longer exist.</p>"
    )
    for course_code, has_changed, _, diffs, still_exists in changed_courses:
        if not has_changed:
            continue
        if not still_exists:
            print(
                f"<details><summary>{course_code} no longer has prerequisites</summary>"
            )
        course_id = "".join(course_code).lower()
        print(f'<h2 id="{course_id}">{course_code}</h2>')
        for i, diff in enumerate(diffs):
            compare_prereqs(course_id, i == 0, diff)
        if not still_exists:
            print("</details>")
    print("</main>")
    print("</body>")


def print_timeline() -> None:
    """
    Can I ask for a companion view/report that does this by term? (e.g. Fa22,
    following courses changes, Sp22, following courses changed, Wi22... etc)
    """
    changed_courses = get_changed_courses()

    # Skip first term because we assume FA12 is when the prereqs have always
    # existed (it won't print the first time a course's prereqs are added to
    # ISIS)
    for term_code in term_codes[1:]:
        print(f"<h2>{term_code}</h2>")
        print("<ul>")
        printed = False
        for course_code, _, _, diffs, _ in changed_courses:
            for i, diff in enumerate(diffs):
                if i == 0 or diff.term != term_code:
                    continue
                added_badge = (
                    f' <span class="added">+{len(diff.added)}</span>'
                    if diff.added
                    else ""
                )
                removed_badge = (
                    f' <span class="removed">−{len(diff.removed)}</span>'
                    if diff.removed
                    else ""
                )
                changed_badge = (
                    f' <span class="changed">±{len(diff.changes)}</span>'
                    if diff.changes
                    else ""
                )
                deleted_badge = " → ❌" if diff.req_count == 0 else ""
                print(
                    f'<li class="course"><a href="./prereq-diffs.html#{"".join(course_code).lower()}-{term_code.lower()}">{course_code}</a>:{added_badge}{removed_badge}{changed_badge}{deleted_badge}</li>'
                )
                printed = True
                break
        if not printed:
            print("<li>No prereqs changed.</li>")
        print("</ul>")


if __name__ == "__main__":
    import sys as sus

    if len(sus.argv) > 1:
        print_timeline()
    else:
        print_diff()
