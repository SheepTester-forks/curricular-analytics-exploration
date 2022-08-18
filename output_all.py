"""
Creates a CSV file for every curriculum and degree plan for every major in
files/output/.
"""

import os
from output import MajorOutput
from parse import major_plans


def csv_to_file(csv: str, path: str) -> None:
    with open(path, "w") as file:
        file.write(csv)


for major_code, plan in major_plans(2021).items():
    os.makedirs(f"./files/output/{major_code}/", exist_ok=True)

    output = MajorOutput(plan)
    csv_to_file(output.output(), f"./files/output/{major_code}/curriculum.csv")
    for college_code in plan.colleges:
        csv_to_file(
            output.output(college_code),
            f"./files/output/{major_code}/{college_code}.csv",
        )
