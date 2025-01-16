"""
python scrape_instructor_grade_archive.py

Scrapes instructor grades from https://asmain.ucsd.edu/home/InstructorGradeArchive
"""

import csv
from html import unescape
from urllib.request import Request, urlopen

SCRAPE_URL = "https://asmain.ucsd.edu/home/InstructorGradeArchive"
OUT_FILE = "scrape_instructor_grade_archive.csv"

print("Fetching %s" % SCRAPE_URL)

with urlopen(
    Request(
        SCRAPE_URL,
        method="POST",
    )
) as response:
    html = response.read().decode("utf-8")

print("Writing to %s" % OUT_FILE)

tr_index = 0

writer = csv.writer(open(OUT_FILE, "w", newline=""))
writer.writerow(
    [
        "Subject",
        "Course",
        "Year",
        "Quarter",
        "Title",
        "Instructor",
        "GPA",
        "A",
        "B",
        "C",
        "D",
        "F",
        "W",
        "P",
        "NP",
    ]
)

while True:
    next_tr = html.find("<tr>", tr_index)
    if next_tr == -1:
        break
    end_tr = html.find("</tr>", next_tr)
    if end_tr == -1:
        raise Exception(f"Unclosed </tr> after index {next_tr}")
    tr_index = end_tr

    row: list[str] = []

    td_index = next_tr
    while True:
        next_td = html.find("<td>", td_index)
        if next_td == -1 or next_td > end_tr:
            break
        end_td = html.find("</td>", next_td)
        if end_td == -1:
            raise Exception(f"Unclosed </tr> after index {next_td}")
        td_index = end_td

        row.append(unescape(html[next_td + len("<td>") : end_td]).strip())

    if row:
        writer.writerow(row)

print("Done")
