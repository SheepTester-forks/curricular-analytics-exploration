"""
python3 curricula_index.py 2015 2022 > files/curricula_index.csv
"""

import sys
from typing import Dict, Tuple
from upload import track_uploaded_curricula

__all__ = ["urls"]

_, start_year, end_year = sys.argv

urls: Dict[Tuple[int, str], str] = {}

for year in range(int(start_year), int(end_year) + 1):
    with track_uploaded_curricula(year) as curricula:
        for major_code, curriculum_id in curricula.items():
            urls[
                year, major_code
            ] = f"https://curricularanalytics.org/curriculums/{curriculum_id}"


if __name__ == "__main__":
    from departments import departments, dept_schools
    from parse import major_codes

    print("School,Department,Major,Year,URL")
    for (year, major_code), url in urls.items():
        department = major_codes()[major_code].department
        department_name = departments.get(department) or "UNKNOWN"
        print(
            ",".join(
                [
                    f'"{dept_schools.get(department) or department_name}"',
                    f'"{department_name}"',
                    major_code,
                    str(year),
                    url,
                ]
            )
        )
