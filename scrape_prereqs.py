import re
from typing import List
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from parse_defs import CourseCode, Prerequisite, TermCode


def get_prereqs(term: TermCode, course: CourseCode) -> List[List[Prerequisite]]:
    prereqs: List[List[Prerequisite]] = []
    with urlopen(
        Request(
            "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesPreReq.htm?"
            + urlencode({"termCode": term, "courseId": "".join(course)}),
        )
    ) as response:
        for match in re.finditer(
            rb'(\.)</td>|<span className="bold_text">([A-Z]+)(\d+[A-Z]*)|<span className="ertext">\*\*\*</span>\s',
            response.read(),
        ):
            subject = match.group(2)
            number = match.group(3)
            if subject is None or number is None:
                if match.group(1) is not None:
                    # New OR-list
                    prereqs.append([])
                else:
                    # *** course may be taken concurrently (eg FA12 ANAR 144)
                    prereqs[-1][-1] = Prerequisite(prereqs[-1][-1].course_code, True)
            else:
                # Prerequisite
                prereqs[-1].append(
                    Prerequisite(CourseCode(subject.decode(), number.decode()), False)
                )
    return prereqs


print(get_prereqs(TermCode("FA98"), CourseCode("ECE", "108")))
print(get_prereqs(TermCode("FA12"), CourseCode("ANAR", "144")))
