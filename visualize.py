"""
Opens the graph visualization in the browser.

python3 visualize.py <year> <major> <college>
"""


import json
from typing import Dict
import webbrowser
from urllib.parse import quote

from output import MajorOutput
from parse import major_plans
from university import university

BASE_PATH = "./graph-demo.html?defaults=ca"


def generate_paths(output: MajorOutput) -> Dict[str, str]:
    return {
        college: BASE_PATH + "#" + quote(json.dumps(output.output_json(college)))
        for college in university.college_codes
        if college in output.plans.colleges
    }


BASE_URL = "https://educationalinnovation.ucsd.edu/_files/graph-demo.html?defaults=ca"


def main(year: int, major: str, college: str):
    url = (
        BASE_URL
        + "#"
        + quote(json.dumps(MajorOutput(major_plans(year)[major]).output_json(college)))
    )
    print(url)
    webbrowser.open(url)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 4:
        raise ValueError("Usage: python3 visualize.py <year> <major> <college>")
    main(int(sys.argv[1]), sys.argv[2], sys.argv[3])
