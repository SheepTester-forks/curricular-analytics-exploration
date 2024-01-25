"""
python3 dump_graphs.py 2022 json
python3 dump_graphs.py 2022 html > reports/output/plan-editor-index.html
"""


import sys
from typing import Dict, List, Tuple
from departments import departments, dept_schools
from output import MajorOutput
from parse import major_codes, major_plans
from university import university
from visualize import generate_paths


def render_plan_urls(year: int) -> None:
    qs_by_dept: Dict[str, Dict[str, Dict[str, Dict[int, List[Tuple[str, str]]]]]] = {}
    years: List[int] = []
    for year in range(2015, 2050):
        all_plans = major_plans(year)
        if all_plans == {}:
            break
        years.insert(0, year)
        for major_code, major_plan in all_plans.items():
            department = departments[major_codes()[major_code].department]
            school = dept_schools.get(major_codes()[major_code].department) or ""
            if school not in qs_by_dept:
                qs_by_dept[school] = {}
            if department not in qs_by_dept[school]:
                qs_by_dept[school][department] = {}
            if major_code not in qs_by_dept[school][department]:
                qs_by_dept[school][department][major_code] = {}
            if year not in qs_by_dept[school][department][major_code]:
                qs_by_dept[school][department][major_code][year] = []
            for college_code, path in generate_paths(MajorOutput(major_plan)).items():
                qs_by_dept[school][department][major_code][year].append(
                    (college_code, path)
                )
    print("<table><tr><th>School</th><th>Department</th><th>Major</th>")
    for year in years:
        print(f"<th>{year}</th>")
    print("</tr>")
    for school, depts in sorted(qs_by_dept.items(), key=lambda entry: entry[0]):
        major_count = sum(len(majors) for majors in depts.values())
        print(f'<tr><th scole="col" rowspan="{major_count}">{school}</th>')
        for i, (department, majors) in enumerate(
            sorted(depts.items(), key=lambda entry: entry[0])
        ):
            if i > 0:
                print("<tr>")
            print(f'<th scole="col" rowspan="{len(majors)}">{department}</th>')
            for j, (major_code, history) in enumerate(
                sorted(majors.items(), key=lambda entry: entry[0])
            ):
                if j > 0:
                    print("<tr>")
                print(f"<td><strong>{major_code}</strong>", end="")
                major_name = major_codes()[major_code].name
                if major_name:
                    print(f": {major_name}")
                print("</td>")
                for year in years:
                    if year not in history:
                        print("<td></td>")
                        continue
                    print("<td>")
                    for college, path in history[year]:
                        print(
                            f'<a href="{path}">{university.college_names[college]}</a><br>'
                        )
                    print("</td>")
                print("</tr>")
    print("</table>")


if __name__ == "__main__":
    render_plan_urls(int(sys.argv[1]))
