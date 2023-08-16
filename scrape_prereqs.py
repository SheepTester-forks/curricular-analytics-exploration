import re
from typing import List
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from parse_defs import CourseCode, TermCode


def get_prereqs(term: TermCode, course: CourseCode) -> List[List[CourseCode]]:
    prereqs: List[List[CourseCode]] = []
    with urlopen(
        Request(
            "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesPreReq.htm?"
            + urlencode({"termCode": term, "courseId": "".join(course)}),
        )
    ) as response:
        for match in re.finditer(
            rb'\.</td>|<span class="bold_text">([A-Z]+)(\d+[A-Z]*)', response.read()
        ):
            subject = match.group(1)
            number = match.group(2)
            if subject is None or number is None:
                prereqs.append([])
            else:
                prereqs[-1].append(CourseCode(subject.decode(), number.decode()))
    return prereqs


print(get_prereqs(TermCode("FA98"), CourseCode("ECE", "108")))
