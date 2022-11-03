"""
python3 dump_prereqs.py FA22
"""

import json
import sys
from parse import prereqs

with open("./reports/output/prereqs.json", "w") as file:
    json.dump(
        {
            str(course_code): [[str(alt.course_code) for alt in req] for req in reqs]
            for course_code, reqs in prereqs(sys.argv[1]).items()
        },
        file,
    )
