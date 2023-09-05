"""
Outputs a CSV file in Curricular Analytics' curriculum and degree plan formats
from the parsed academic plans and course prerequisites.

Exports:
    `MajorOutput`, a class capable of producing degree plans or a curriculum for
    a particular major in Curricular Analytics' CSV and JSON formats.
"""

from typing import Dict, Generator, List, NamedTuple, Optional, Set

import curricularanalytics as ca
import output_json as obj

from parse import MajorPlans, major_codes, prereqs
from parse_defs import CourseCode, Prerequisite, ProcessedCourse
from university import university
from util import CsvWriter

__all__ = ["MajorOutput"]

HEADER = [
    "Course ID",
    "Course Name",
    "Prefix",
    "Number",
    "Prerequisites",
    "Corequisites",
    "Strict-Corequisites",
    "Credit Hours",
    "Institution",
    "Canonical Name",
    "Term",
]
CURRICULUM_COLS = 10
DEGREE_PLAN_COLS = 11


class OutputCourse(NamedTuple):
    """
    A course output by `OutputCourses`. This contains all the fields necessary
    for a course row in a curriculum/degree plan CSV file. This helps reduce
    code repetition between outputting a curriculum vs. a degree plan and a CSV
    vs. JSON file, which each have many similarities.
    """

    course_id: int
    course_title: str
    course_code: CourseCode
    prereq_ids: List[int]
    coreq_ids: List[int]
    units: float
    term: int


class OutputCourses:
    """
    Lists courses in a ready-to-go format for creating a CSV or JSON file.

    Why not return a list directly? This intermediate class allows courses to be
    separated based on whether they're a major or college course because degree
    plan CSVs specifically have a separate section for "Additional Courses."
    Maybe I could've instead output a tuple or something depending on what is
    needed, but in Python it seems easier to me to loop over a list again and
    only yield what is necessary rather than partition a list beforehand.

    `start_id` is the next unassigned ID that can be assigned to additional
    courses.

    `course_ids` is a *clone* of that from `MajorOutput` because degree plan
    additional courses do not share course IDs between each other on Curricular
    Analytics.
    """

    processed_courses: List[ProcessedCourse]
    current_id: int
    course_ids: Dict[CourseCode, int]
    duplicate_titles: Dict[str, int]
    claimed_ids: Set[CourseCode]
    year: int

    def __init__(self, parent: "MajorOutput", college: Optional[str]) -> None:
        self.processed_courses = (
            parent.plans.plan(college) if college else parent.curriculum
        )
        self.year = parent.plans.year

        # 3. Assign course IDs
        self.current_id = parent.start_id
        self.course_ids = {**parent.course_ids}
        for course in self.processed_courses:
            if course.course_code and course.course_code not in self.course_ids:
                self.course_ids[course.course_code] = self.current_id
                self.current_id += 1

        # Get duplicate course titles so can start with "GE 1" and so on
        course_titles = [course.course_title for course in self.processed_courses]
        self.duplicate_titles = {
            title: 0
            for i, title in enumerate(course_titles)
            if title in course_titles[0:i]
        }

        # In case there are duplicate courses, only let a course in course_ids
        # get used once
        self.claimed_ids = set(self.course_ids.keys())

    # 4. Get prerequisites
    def _find_prereq(
        self,
        prereq_ids: List[int],
        coreq_ids: List[int],
        alternatives: List[Prerequisite],
        before: int,
    ) -> None:
        """
        Helper method to find prerequisites and corequisites for a course.

        This takes care to prevent backwards prereqs, where a course that could
        satisfy the prerequisites for another course shows up *later* in a plan.
        See #47.

        This also *only* uses the first (i.e. earliest, as
        `self.processed_courses` is chronological) prerequisite found. It
        shouldn't matter too much if there are too many prerequisite arrows, but
        it does affect the complexity score on Curricular Analytics. See #25.

        `prereq_ids` and `coreq_ids` are mutable *references* to a list to which
        prerequisite course IDs are added.

        `before` is the term index of the course in question to prevent a course
        from being marked as a prereq of a past course.
        """
        # Find first processed course whose code is in `alternatives`
        for course in self.processed_courses:
            if course.course_code is None:
                continue
            if course.term_index >= before:
                return
            for code, concurrent in alternatives:
                if course.course_code == code:
                    (coreq_ids if concurrent else prereq_ids).append(
                        self.course_ids[course.course_code]
                    )
                    return

    def list_courses(
        self, show_major: Optional[bool] = None
    ) -> Generator[OutputCourse, None, None]:
        """
        The methods involved with actually outputting the CSV/JSON file should
        call this method, yielding `OutputCourse`s.

        `show_major` filters courses by whether they're a major or college
        requirement. If `show_major` is None or unspecified, all courses will be
        yielded.
        """
        for course_title, code, units, major_course, term, _ in self.processed_courses:
            if show_major is not None and major_course != show_major:
                continue

            if code in self.claimed_ids:
                course_id = self.course_ids[code]
                self.claimed_ids.remove(code)
            else:
                course_id = self.current_id
                self.current_id += 1

            prereq_ids: List[int] = []
            coreq_ids: List[int] = []
            if code:
                reqs = prereqs(university.get_term_code(self.year, term)).get(code)
            else:
                reqs = university.non_course_prereqs.get(course_title)
            if reqs:
                for alternatives in reqs:
                    self._find_prereq(
                        prereq_ids,
                        coreq_ids,
                        alternatives,
                        term,
                    )

            if course_title in self.duplicate_titles:
                self.duplicate_titles[course_title] += 1
                course_title = f"{course_title} {self.duplicate_titles[course_title]}"

            yield OutputCourse(
                course_id,
                course_title,
                code or CourseCode("", ""),
                prereq_ids,
                coreq_ids,
                units,
                term,
            )


class MajorOutput:
    """
    Keeps track of the course IDs used by a curriculum so major courses share
    the same ID across degree plans. Otherwise, if a degree plan uses an ID for
    a different course, it renames courses with that ID in all other degree
    plans and the curriculum in Curricular Analytics.
    """

    plans: MajorPlans
    course_ids: Dict[CourseCode, int]
    curriculum: List[ProcessedCourse]
    start_id: int

    def __init__(self, plans: MajorPlans, start_id: int = 1) -> None:
        self.plans = plans
        self.course_ids = {}
        self.curriculum = self.plans.curriculum()
        self.start_id = start_id

        for course in self.curriculum:
            if course.course_code and course.course_code not in self.course_ids:
                self.course_ids[course.course_code] = self.start_id
                self.start_id += 1

    def output(self, college: Optional[str] = None) -> str:
        """
        Outputs a curriculum or degree plan in Curricular Analytics' CSV
        format[^1], yielding one row at a time.

        To output a degree plan, specify the college that the degree plan is
        for. If the college isn't specified, then `_output_plan` will output the
        major's curriculum instead.

        [^1]: https://curricularanalytics.org/files
        """
        if college is not None and college not in self.plans.colleges:
            raise KeyError(f"No degree plan available for {college}.")
        output = CsvWriter(DEGREE_PLAN_COLS if college else CURRICULUM_COLS)
        major_info = major_codes()[self.plans.major_code]
        output.row("Curriculum", major_info.name)
        if college:
            output.row(
                "Degree Plan", f"{major_info.name}/ {university.college_names[college]}"
            )
        output.row("Institution", university.name)
        # NOTE: Currently just gets the last listed award type (bias towards BS over
        # BA). Will see how to deal with BA vs BS
        # For undeclared majors, there is no award type, so will just use
        # Curricular Analytics' default, BS.
        output.row(
            "Degree Type",
            list(major_info.award_types)[-1] if major_info.award_types else "BS",
        )
        output.row("System Type", university.term_type)
        output.row("CIP", major_info.cip_code)

        processed = OutputCourses(self, college)

        for major_course_section in True, False:
            if not college and not major_course_section:
                break
            output.row("Courses" if major_course_section else "Additional Courses")
            output.row(*HEADER)
            for (
                course_id,
                course_title,
                (subject, number),
                prereq_ids,
                coreq_ids,
                units,
                term,
            ) in processed.list_courses(major_course_section):
                output.row(
                    str(course_id),  # Course ID
                    course_title,  # Course Name
                    subject,  # Prefix
                    number,  # Number
                    ";".join(map(str, prereq_ids)),  # Prerequisites
                    ";".join(map(str, coreq_ids)),  # Corequisites
                    "",  # Strict-Corequisites
                    f"{units:g}",  # Credit Hours; https://stackoverflow.com/a/2440708
                    "",  # Institution
                    "",  # Canonical Name
                    str(term + 1),  # Term
                )

        return output.done()

    def output_json(self, college: Optional[str] = None) -> obj.Curriculum:
        """
        Like `_output_plan`, but outputs a JSON-serializable `Curriculum` object
        instead. This JSON format is what the Curricular Analytics site
        currently uses when you edit or create a curriculum or degree plan with
        a GUI.
        """
        curriculum = obj.Curriculum(curriculum_terms=[])
        processed = OutputCourses(self, college)
        # Put college courses at the bottom of each quarter, consistent with CSV
        for major_course_section in True, False:
            if not college and not major_course_section:
                break
            for (
                course_id,
                course_title,
                _,
                prereq_ids,
                coreq_ids,
                units,
                term,
            ) in processed.list_courses(major_course_section):
                while term >= len(curriculum["curriculum_terms"]):
                    curriculum["curriculum_terms"].append(
                        obj.Term(
                            id=len(curriculum["curriculum_terms"]) + 1,
                            curriculum_items=[],
                        )
                    )
                curriculum["curriculum_terms"][term]["curriculum_items"].append(
                    obj.CurriculumItem(
                        name=course_title,
                        id=course_id,
                        credits=units,
                        curriculum_requisites=[
                            obj.Requisite(
                                source_id=prereq_id, target_id=course_id, type="prereq"
                            )
                            for prereq_id in prereq_ids
                        ]
                        + [
                            obj.Requisite(
                                source_id=coreq_id, target_id=course_id, type="coreq"
                            )
                            for coreq_id in coreq_ids
                        ],
                    )
                )
        return curriculum

    def output_degree_plan(self, college: str) -> ca.DegreePlan:
        processed = list(OutputCourses(self, college).list_courses())
        course_objects: List[ca.AbstractCourse] = []
        course_object_by_id: Dict[int, ca.AbstractCourse] = {}
        for course in processed:
            course_object = ca.Course(
                course.course_title,
                course.units,
                id=course.course_id,
                prefix=course.course_code[0],
                num=course.course_code[1],
            )
            course_objects.append(course_object)
            if course.course_id not in course_object_by_id:
                course_object_by_id[course.course_id] = course_object
        for course, course_object in zip(processed, course_objects):
            course_object.add_requisites(
                [
                    (course_object_by_id[prereq_id], ca.pre)
                    for prereq_id in course.prereq_ids
                ]
            )
            course_object.add_requisites(
                [
                    (course_object_by_id[coreq_id], ca.co)
                    for coreq_id in course.coreq_ids
                ]
            )
        term_count = max(course.term for course in processed)
        return ca.DegreePlan(
            f"{self.plans.major_code} {college}",
            ca.Curriculum(
                f"{self.plans.major_code} {college}",
                course_objects,
                sort_by_id=False,
            ),
            [
                ca.Term(
                    [
                        course_object
                        for course, course_object in zip(processed, course_objects)
                        if course.term == i
                    ]
                )
                for i in range(term_count)
            ],
        )

    @classmethod
    def from_json(cls, plans: MajorPlans, json: obj.VisCurriculum) -> "MajorOutput":
        """
        Creates a `MajorOutput` using the same course IDs from an existing
        curriculum or degree plan. This way, modifying a degree plan won't
        inadvertently change the course data of the curriculum on the Curricular
        Analytics website.
        """
        output = MajorOutput(plans)
        output.course_ids = {}
        output.start_id = 1
        for course in json["courses"]:
            if course["prefix"] and course["num"]:
                output.course_ids[CourseCode(course["prefix"], course["num"])] = course[
                    "id"
                ]
            if course["id"] + 1 > output.start_id:
                output.start_id = course["id"] + 1
        return output


if __name__ == "__main__":
    import sys
    from parse import major_plans

    _, year, major, college = sys.argv + [""] * (4 - len(sys.argv))
    print(MajorOutput(major_plans(int(year))[major]).output(college or None))
