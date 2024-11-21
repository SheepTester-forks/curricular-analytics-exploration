"""
python3 dump_graphs.py json
python3 dump_graphs.py html > reports/output/plan-editor-index.html
python3 dump_graphs.py files
"""

import json
import os
import re
import sys
from typing import Dict, List, Tuple
from urllib.parse import urlencode
from departments import departments, dept_schools
from output import MajorOutput
from parse import major_codes, major_plans, prereqs, terms
from university import university


def render_plan_files() -> None:
    min_year = 2015
    max_year = min_year
    for year in range(min_year, 2050):
        all_plans = major_plans(year)
        if all_plans == {}:
            break
        max_year = year
        for major_code, major_plan in all_plans.items():
            output = MajorOutput(major_plan)
            os.makedirs(f"./plan_csvs/{year}/{major_code}/", exist_ok=True)
            with open(
                f"./plan_csvs/{year}/{major_code}/{year}_{major_code}.csv",
                "w",
            ) as file:
                file.write(output.output())
            for college in university.college_codes:
                if college in major_plan.colleges:
                    with open(
                        f"./plan_csvs/{year}/{major_code}/{year}_{major_code}_{college}.csv",
                        "w",
                    ) as file:
                        file.write(output.output(college))

    os.makedirs(f"./plan_csvs/prereqs/", exist_ok=True)
    for term in terms():
        with open(f"./plan_csvs/prereqs/{term}.json", "w") as file:
            for i, (course_code, reqs) in enumerate(prereqs(term).items()):
                file.write("{ " if i == 0 else ", ")
                json.dump(str(course_code), file)
                file.write(": ")
                json.dump(
                    [[repr(alt) for alt in req] for req in reqs],
                    file,
                )
                file.write("\n")
            file.write("}\n")

    with open("./plan_csvs/metadata.json", "w") as file:
        json.dump(
            {
                "min_plan_year": min_year,
                "max_plan_year": max_year,
                "min_prereq_term": terms()[0],
                "max_prereq_term": terms()[-1],
            },
            file,
            indent="\t",
        )
        file.write("\n")


def render_plan_json() -> None:
    plan_jsons: Dict[str, str] = {}
    for year in range(2015, 2050):
        all_plans = major_plans(year)
        if all_plans == {}:
            break
        for major_code, major_plan in all_plans.items():
            output = MajorOutput(major_plan)
            for college in university.college_codes:
                if college in major_plan.colleges:
                    plan_jsons[f"{year}.{major_code}.{college}"] = re.sub(
                        r",+\n",
                        "\n",
                        output.output(college).replace("\r\n", "\n"),
                    )
    json.dump(plan_jsons, sys.stdout, separators=(",", ":"))


def escape_html(string: str) -> str:
    return (
        string.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def render_plan_urls() -> None:
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
            for college in university.college_codes:
                if college in major_plan.colleges:
                    qs_by_dept[school][department][major_code][year].append(
                        (
                            college,
                            "?" + urlencode({"plan": f"{year}.{major_code}.{college}"}),
                        )
                    )
    titles = json.dumps(
        {
            f"{major_code}.{college}": f"{major_code} ({university.college_names[college]}, !YEAR!): {major_codes()[major_code].name}"
            for year in range(2015, 2050)
            for all_plans in (major_plans(year),)
            if all_plans != {}
            for major_code, major_plan in all_plans.items()
            for college in university.college_codes
            if college in major_plan.colleges
        }
    ).replace("'", "\\'")
    print("<script>")
    print(f"const titles = JSON.parse('{titles}')")
    print("const url = new URL(window.location.href)")
    print("const params = url.searchParams")
    print("const plan = params.get('plan')")
    print("if (plan) {")
    print("  window.stop()")
    print("  params.append('defaults', 'ucsd')")
    print("  params.delete('plan')")
    print("  const [year, major, college] = plan.split('.')")
    print("  params.append('year', year)")
    print("  params.append('major', major)")
    print(
        "  params.append('title', titles[`${major}.${college}`].replace('!YEAR!', year))"
    )
    print("  url.hostname = 'stage-educationalinnovation.ucsd.edu'")
    print("  url.pathname = '/_files/plan-graph.html'")
    print(
        "  fetch(`https://raw.githubusercontent.com/SheepTester-forks/ucsd-degree-plans/main/${year}/${major}/${year}_${major}_${college}.csv`)"
    )
    print("    .then(r => r.text())")
    print("    .then(csv => {")
    print("      url.hash = encodeURIComponent(csv)")
    print("      window.location.replace(url)")
    print("    })")
    print("}</script>")
    print("<table><tr><th>School</th><th>Department</th><th>Major</th>")
    for year in years:
        print(f"<th>{year}</th>")
    print("</tr>")
    for school, depts in sorted(qs_by_dept.items(), key=lambda entry: entry[0]):
        major_count = sum(len(majors) for majors in depts.values())
        print(
            f'<tr><th scole="col" rowspan="{major_count}"><span>{escape_html(school)}</span></th>'
        )
        for i, (department, majors) in enumerate(
            sorted(depts.items(), key=lambda entry: entry[0])
        ):
            if i > 0:
                print("<tr>")
            print(
                f'<th scole="col" rowspan="{len(majors)}"><span>{escape_html(department)}</span></th>'
            )
            for j, (major_code, history) in enumerate(
                sorted(majors.items(), key=lambda entry: entry[0])
            ):
                if j > 0:
                    print("<tr>")
                print(f"<td><strong>{major_code}</strong>", end="")
                major_name = major_codes()[major_code].name
                if major_name:
                    print(f": {escape_html(major_name)}")
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
    if sys.argv[1] == "json":
        render_plan_json()
    elif sys.argv[1] == "files":
        render_plan_files()
    else:
        render_plan_urls()
