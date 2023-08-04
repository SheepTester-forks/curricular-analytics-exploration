## Setup

[`parse.py`](parse.py) expects certain files in the `files/` directory. Download them from our shared Google Drive folder.

- [**`academic_plans_fa12.csv`**](https://drive.google.com/file/d/1SMNCi_UD3NoIyUt8TidpPOWha_pOx3il/view),
  containing degree plans for every year, major, and college combination since
  fall 2012 created by college advisors painstakingly cross-referencing major
  and college requirements to manually design plans for every major, so there
  are some human errors. These plans are publicly available at
  [plans.ucsd.edu](https://plans.ucsd.edu/).

  We use this to create degree plans and curriculum for every major to upload to
  [Curricular Analytics](https://curricularanalytics.org/).

  If others want to adapt our code for their university, here is sampling of rows to show what we were dealing with.

  | Department | Major | College | Course  | Units | Course Type | GE/Major Overlap | Start Year | Year Taken | Quarter Taken | Term Taken |
  | ---------- | ----- | ------- | ------- | ----- | ----------- | ---------------- | ---------- | ---------- | ------------- | ---------- |
  | ANTHROPOLO | AN27  | SI      | ANTH 1  | 4.0   | DEPARTMENT  | N                | 2012       | 1          | 1             | FA12       |
  | ANTHROPOLO | AN27  | SI      | CAT 1   | 4.0   | COLLEGE     | N                | 2012       | 1          | 1             | FA12       |
  | BENG       | BE25  | FI      | CHEM 6A | 4.0   | DEPARTMENT  | N                | 2012       | 1          | 1             | FA12       |
  | BENG       | BE25  | MU      | CHEM 6A | 4.0   | DEPARTMENT  | N                | 2012       | 1          | 1             | FA12       |

  - `Major` is an [ISIS major
    code](https://blink.ucsd.edu/instructors/academic-info/majors/major-codes.html).

  - `College` is a two-letter code for a UCSD college.

    | Code | Name                                               |
    | ---- | -------------------------------------------------- |
    | RE   | Revelle                                            |
    | MU   | Muir                                               |
    | TH   | Marshall (formerly Third)                          |
    | WA   | Warren                                             |
    | FI   | ERC (formerly Fifth)                               |
    | SI   | Sixth                                              |
    | SN   | Seventh                                            |
    | DP   | Appears in the file, but we're not sure what it is |

    Generally speaking, every major has a plan for every college. However, there
    are exceptions, usually for weird majors that aren't actually 4-year plans
    (e.g. only Revelle has plans for undeclared "majors").

    For universities without a college system, this column can be set to a single value or be used for plans with different general education requirements (e.g. an honors college). The Python programs do not expect a specific format for college codes.

  - `Course` is a **manually-written** description of a course. It's usually the
    course subject and number, but it can also be a phrase like "CSE Elective"
    or list alternatives like "MATH 10A/20A." Human error makes parsing this
    difficult; see [`parse_course_name`](./parse_course_name.py) for an attempt.

    Course codes from other colleges will likely require modifying the implementation of [`parse_course_name`](./parse_course_name.py).

  - `Course Type` is either `DEPARTMENT` (major requirement) or `COLLEGE` (GE requirement). When `GE/Major Overlap`
    is `Y` (a course satisfies both major and college requirements), it doesn't matter what `Course Type` is.

    To get a curriculum (the major requirements) from a plan, we only keep
    courses with a `Course Type` of `DEPARTMENT` _or_ a `GE/Major Overlap` of
    `Y`.

    We were not provided a plan with only major requirements. According to #14 it seems
    removing college-specific courses from Marshall (TH)'s degree plan tends to
    produce the most compatible results for other colleges, so we base curricula
    off of Marshall.

    Currently, many parts of the code only handle UCSD's seven colleges. Some modification would be required to use other college codes.

  - `Start Year` indicates the year that the plan is for. For example, a student
    who enrolls at UCSD in fall 2019 should follow the plan with a `Start Year`
    of 2019.

  - `Year Taken` and `Quarter Taken` define the *n*th school year and *n*th quarter.

    Our Python programs expect four quarters per year (this includes a summer quarter at the end of each year, even though plans should not require summer sessions), but not all quarters need to be used. For universities on the semester system, the first two quarters could be used to represent the two semesters.

    Many parts of the code currently expect four years, each with three quarters. Summer quarters (the fourth quarter of each year) are merged with the prior spring quarter.

  - `Term Taken` is not used.

- [**`prereqs_fa12.csv`**](https://drive.google.com/file/d/19oVI16mmhDIclyj6p3GMlxTMPDRNIcHw/view),
  containing every course and their prerequisites for every quarter since fall 2012.

  We use this to add prerequisite and corequisite relationships between courses
  in the degree plans for [Curricular
  Analytics](https://curricularanalytics.org/).

  Here are some sample rows from the CSV file.

  | Term Code | Term ID | Course ID | Course Subject Code | Course Number | Prereq Sequence ID | Prereq Course ID | Prereq Subject Code | Prereq Course Number | Prereq Minimum Grade Priority | Prereq Minimum Grade | Allow concurrent registration |
  | --------- | ------- | --------- | ------------------- | ------------- | ------------------ | ---------------- | ------------------- | -------------------- | ----------------------------- | -------------------- | ----------------------------- |
  | FA22      | 5250    | CHEM43AM  | CHEM                | 43AM          | 001                | CHEM7L           | CHEM                | 7L                   | 600                           | P                    | N                             |
  | FA22      | 5250    | CHEM43AM  | CHEM                | 43AM          | 001                | CHEM7LM          | CHEM                | 7LM                  | 600                           | P                    | N                             |
  | FA22      | 5250    | CHEM43AM  | CHEM                | 43AM          | 002                | CHEM40A          | CHEM                | 40A                  | 600                           | P                    | N                             |
  | FA22      | 5250    | CHEM43AM  | CHEM                | 43AM          | 002                | CHEM40AH         | CHEM                | 40AH                 | 600                           | P                    | N                             |
  | FA22      | 5250    | CHEM43AM  | CHEM                | 43AM          | 002                | CHEM41A          | CHEM                | 41A                  | 600                           | P                    | N                             |
  | FA22      | 5250    | CHEM6A    | CHEM                | 6A            |                    |                  |                     |                      |                               |                      |
  | FA22      | 5250    | CHEM6AH   | CHEM                | 6AH           |                    |                  |                     |                      |                               |                      |

  Some courses do not have prerequisites, so they will have a single row with
  empty fields after `Course Number`.

  For courses with prerequisites, they will have a row for every prerequisite
  course. `Prereq Sequence ID` is a natural number, and of the prerequisites
  with the same `Prereq Sequence ID`, only one course is needed to satisfy the
  requirement. One course from each `Prereq Sequence ID` is required to satisfy
  the prerequisites for the course.

  It's unclear what `Allow concurrent registration` really means---only a few
  courses have it set to `Y`. Some course pairs, such as CSE 12 and 15L, are
  supposedly corequisites according to the course catalog, but they are not
  listed as corequisites in the table. The Python program creates a corequisite relationship between two courses with this flag set to `Y`.

  `Term ID`, `Course ID`, `Prereq Course ID`, `Prereq Minimum Grade Priority`,
  and `Prereq Minimum Grade` aren't used.

  `Term Code` is respected in case prerequisites change midway through the plan. They currently are expected to be in UCSD's term code format: `<quarter><year>`, such as `FA22` for Fall 2022.

- **`isis_major_code_list.xlsx - Major Codes.csv`**: Open [isis_major_code_list.xlsx "Major Codes"](https://docs.google.com/spreadsheets/d/1Mgr99R6OFXJuNO_Xx-j49mBgurpwExKL/edit#gid=616727155) and go to File > Download > Comma Separated Values (.csv). This should be the default name it suggests, so you don't have to worry about setting the name.

  The spreadsheet is a modified version of the publicly available [list of ISIS
  major
  codes](https://blink.ucsd.edu/_files/instructors-tab/major-codes/isis_major_code_list.xlsx).

  We use this to add the major name and CIP major code to the uploaded
  curriculum on the [Curricular Analytics
  website](https://curricularanalytics.org/).

  | Previous Local Code | UCOP Major Code (CSS) | ISIS Major Code | Major Abbreviation | Major Description              | Diploma Title                             | Start Term | End Term | Student Level | Department | Award Type | Program Length (in years) | College              | CIP Code | CIP Description                | STEM | Self Supporting | Discontinued or Phasing Out | Notes                                                                   |
  | ------------------- | --------------------- | --------------- | ------------------ | ------------------------------ | ----------------------------------------- | ---------- | -------- | ------------- | ---------- | ---------- | ------------------------- | -------------------- | -------- | ------------------------------ | ---- | --------------- | --------------------------- | ----------------------------------------------------------------------- |
  |                     | 0HK                   | AA25            | BlkDspAfAm         | Black Diaspora &African AmrcSt | Black Diaspora & African American Studies | S122       |          | UN            | AAS        | BA         | 4.00                      | RE MU TH WA FI SI SN | 050201   | AFRICAN-AMERICAN/BLACK STUDIES |      |                 |                             | Administrative start in S1 to accommodate new students attending Summer |

  Only the following fields are used:

  - `ISIS Major Code` is the major code used by UCSD and the Python programs as an ID for each major. At UCSD, they are of the format `<subject><number>`, such as `CG25` for Cognitive Science. The Python programs do not expect a specific format for these major codes.

  - `Diploma Title` is used as a human-readable display name for the major.

  - `Department` is a department code used to group majors by departments and schools. The Python programs don't expect a specific format for department codes, but the way majors are grouped for Tableau views is defined in [`departments.py`](./departments.py).

  - `Award Type` (BS vs BA) and `CIP Code` (national major codes) are used to populate data fields for Curricular Analytics. That's it.

### Uploading

To automatically upload CSV files to Curricular Analytics using [`upload.py`](upload.py), you need to create a copy of [`.env.example`](.env.example) and name it `.env`, then fill in `AUTHENTICITY_TOKEN` and `CA_SESSION`.

- To get `CA_SESSION`, open inspect element and head to Application > Cookies > https://curricularanalytics.org. Copy the cookie value for `_curricularanalytics_session`.

  ![`_curricularanalytics_session` cookie](./docs/ca_session.png)

## What do the files do??

I've just been dumping all files remotely related to Curricular Analytics here, so things are pretty messy, sorry about that.

Inconsistently, some programs only work with 2021's academic plans, while other programs work with plans from 2015 to 2022, either requiring that you specify the year or performing analysis on all they years. The latter is occasionally identified as `fa12` and includes data for plans from 2012, but Carlos says to only consider plans starting in 2015.

**parse.py** parses `files/academic_plans_fa12.csv`, `files/prereqs_fa12.csv`, and `files/isis_major_code_list.xlsx - Major Codes.csv`.

<!-- - Serves as a playground for exploring the parsed academic plan, prereq, and major data. -->

**output.py** combines the plans and prereqs from parse.py and produces a CSV file or JSON (defined by output_json.py) for Curricular Analytics.

- CLI: `python3 output.py <year> <major> [college]` will print the Curricular Analytics curriculum or degree plan CSV, depending on if `college` is specified.

**upload.py** uploads (using api.py) the curriculum and degree plans produced by output.py to Curricular Analytics, keeping track of the curriculum IDs in `files/uploaded<year>.yml`.

- CLI: Uploads the specified major to Curricular Analytics.

  ```
  $ python3 upload.py --help
  usage: upload.py [-h] [--org ORG] [--year YEAR] [--initials INITIALS] [--json] [--track] major_code

  Automatically upload a major's curriculum and degree plans onto Curricular Analytics.

  positional arguments:
    major_code           The ISIS code of the major to upload.

  optional arguments:
    -h, --help           show this help message and exit
    --org ORG            The ID of the Curricular Analytics organization to add the curriculum to. Default: $ORG_ID
    --year YEAR          The catalog year.
    --initials INITIALS  Your initials, to sign the CSV file names. Default: $INITIALS
    --json               Upload by JSON rather than by CSV files. Uploading by JSON is slower. Default: upload CSV files
    --track              Whether to keep track of uploaded curricula in files/uploaded[year].yml. Default: don't keep track
  ```

**update.py** can update or delete an existing curriculum or degree plan on Curricular Analytics using api.py.

- CLI: `python3 update.py (edit|delete) <major> [college]` updates or deletes the specified major's curriculum or degree plan, depending on if `college` is specified.

### Helpers

**college_names.py** maps college codes to their name.

**departments.py** maps department codes to their name (based on `files/LoadSearchControls.json` from plans.ucsd.edu) and the name of the school they're part of.

<!-- - CLI: Prints the departments without a school. -->

**parse_course_name.py** tries to get a course code from a course title (manually written by college advisors) to determine a course's prereqs.

**api.py** defines helper methods for interacting with Curricular Analytics' internal API.

<!-- - CLI: Serves as a playground for testing the API methods. -->

**output_json.py** defines the JSON structure for JSON relating to the Curricular Analytics API.

**util.py** just has helper functions.

### In Julia (to use with CurricularAnalytics.jl)

**Parse.jl** is basically equivalent to parse.py.

**Output.jl** is basically equivalent to output.py.

**Utils.jl** contains some utility functions.

### Analysis

Note: "outputs `<file name>`" means the program prints to standard output, which I then piped into the file. "produces `<file name>`" means the program directly writes to the file.

**check_uploaded.py** checks every curriculum and degree plan on Curricular Analytics to check that they uploaded properly. Uploading curricula too quickly sometimes prevents them from being processed correctly, and so there can be missing courses or terms.

**cms-replace-file.js** is a script to help with replacing large HTML files on the UCSD CMS.

**college_ges.py** outputs `college_ges.csv` and `reports/output/college-ge-units-fragment.html`. It determines the number of additional units each college adds to a major's degree plan through its general education requirements. This is used to generate the [_Additional Units from College-Specific General Education Requirements_](https://educationalinnovation.ucsd.edu/ca-views/college-ge-units.html) report.

**common_prereqs.py** outputs `common_prereqs.txt`. We decided that `SOCI- UD METHODOLOGY` and `TDHD XXX` should have hardcoded prerequisites even though they aren't specific course codes because all of the course options share the same prereqs. I wanted to see whether other subjects or their upper division electives also share many prereqs in common.

**compare-curricula.py** outputs `comparisons.txt`. It lists differences between department-type courses in college academic plans for each major. It can also identify whether a college differs from all the other colleges. It counts how often a college deviates from the others and determines that Marshall tends to deviate the least, so it is the best candidate for basing a curriculum off of.

**course_names.py** outputs `course_names.txt`. It helped me figure out an implementation for `parse_course_name` (in parse_course_name.py) by listing all unique course names and their parsed course code, if any, based on a draft algorithm side-by-side.

**course_names2.py** outputs `course_names2.txt`. Similar to course_names.py, it lists unique course names and their result side-by-side. However, instead of parsing course codes, it tries to clean up the raw course title manually written by college advisors. This is used to prevent strange stray asterisks and the like from appearing in the uploaded curricula on Curricular Analytics.

**course_names3.py** outputs `course_names3.txt`. This is an implementation of Arturo's [course name cleanup algorithm](https://www.overleaf.com/read/ncghhmgtxtgb), and it lists all the unique course names resulting from the algorithm and how often they occur.

**courses_req_by_majors.py** outputs each course and the majors that require them. This duplicates [_Number of plans to include a given course by year_](https://public.tableau.com/app/profile/sean.yen/viz/reports_16591343716100/Report1); I made this quickly to see if there are non-ECE majors that require ECE courses.

**CourseMetrics.jl** produces `files/courses_fa12.csv`, a CSV file containing the complexity and centrality scores of each identifiable course (i.e. courses with a course code) in each major curriculum. Used for the first two views in [_Courses at a glance_](https://public.tableau.com/app/profile/sean.yen/viz/reports_16591343716100/Report1) on Tableau.

**CourseOverlap.jl** produces `files/course_overlap.csv`, a CSV file containing the percentage of how many courses in each major curriculum overlaps with another curriculum. Used for ["Course overlap between majors"](https://public.tableau.com/app/profile/sean.yen/viz/reports_16591343716100/Report1) on Tableau.

**curricula_index.py** outputs `files/curricula_index.csv`, a CSV file containing the school, department, and Curricular Analytics curriculum URL of every major. As a module, it exports `urls`, which maps majors to their URL. Used for [_Curriculum Index_](https://public.tableau.com/app/profile/sean.yen/viz/curriculum_index/Index) on Tableau.

**department_names.py** outputs `departments.txt`, which compares the list of unique department codes of the degree plans available with the department codes from the ISIS major code spreadsheet. This is to figure out which department names I don't need to get the name for.

**diff_plan.py** outputs `diff/diffs.json` and depends on `files/metrics_fa12.csv` from Metrics.jl. It determines the changes made to an academic plan over the years for every major. This is used to produce the [_Changes to Academic Plans over Time_](https://educationalinnovation.ucsd.edu/ca-views/plan-changes.html) report.

**diff_prereqs.py** outputs `reports/output/prereq-diffs-fragment.html` and `reports/output/prereq-timeline-fragment.html`, which are used for the [_Changes to Prerequisites over Time_](https://educationalinnovation.ucsd.edu/ca-views/prereq-changes.html) reports.

- CLI: `python3 diff_plan.py <major> <college>` will print a fancy diff for the academic plans in the terminal. Otherwise, it'll print the JSON file.

**flag_issues.py** automatically identifies and prints various issues grouped by type found in the academic plans.

**majors_per_course.py** produces `files/majors_per_course.csv`, a CSV file listing the number of majors each course appears in to determine how many majors rely on math 18 (apparently the math department doesn't know).

**marshall-viability-analysis.py** outputs `marshall.txt`. It identifies in which majors does Marshall's academic plan deviate from all the other colleges. This is to check that its academic plans are generally a good base for creating curricula.

**metrics.jl** depends on `files/output/` from output_all.py and produces `files/metrics.csv`, a CSV file with various metrics for each academic plan, and `files/courses.csv`, a CSV file identifying the major in which the course has the highest centrality for each course. I wrote this before writing the other Julia files, which is why it doesn't use Output.jl. Used for [metrics](https://public.tableau.com/app/profile/sean.yen/viz/metrics_16619827387790/MatrixGEs) on Tableau.

**Metrics.jl** produces `files/metrics_fa12.csv`, a CSV file with various metrics for each academic plan. This one is newer than metrics.jl and contains exactly the metrics that Carlos wanted. Used for [metrics_fa12](https://public.tableau.com/app/profile/sean.yen/viz/metrics_fa12/View1) on Tableau.

**output_all.py** produces a CSV file for the curriculum and each college's degree plan for every major in `files/output/`.

**PlanChanges.jl** produces `files/changes.csv` to determine which academic plans changed the most. This has now been superseded by diff/diffs.json from diff_plan.py.

**redundant_prereq_check.py** was an attempt at identifying redundant prerequisites (for example, a course requiring both MATH 20A and 20B has a redundant 20A requirement because 20B implies 20A). This has been superseded by Metrics.jl.

**redundant_prereq_courses.py** outputs `redundant_prereq_courses.csv`. In addition to identifying prerequisites that are redundant because they would've already been taken to satisfy another prerequisite, it also identifies courses that strictly require a course that no longer exists. The CSV file allows you to filter by error type.

**rename_all.py** is a script to rename all the 2021 curricula uploaded on Curricular Analytics to include the year.

**unit_check.py** prints the degree plans with fewer than 180 units.

**unit_per_course.py** outputs `units_per_course.json` and `units_per_course.txt`. Some courses have an incorrect number of units listed in the academic plan. The script goes through each plan and lists the frequency of each number of units per course to determine by majority vote which number of units is most likely to be correct for the course. For example, LTSP 2A is 5 units, but a few plans list it as 4 units.

## Development (plan diff, prereq tree, and plan editor)

Run this first.

```sh
$ make reports/output/academic-plan-diffs.js
$ make reports/output/prereqs.js
```

Watch for changes. Open the template file in the browser:

- reports/plan-diffs-template.html
- reports/prereq-tree-template.html
- reports/plan-editor-template.html

```sh
$ deno task watch:plan-diff
$ deno task watch:prereq-tree
$ deno task watch:plan-editor
```

Build a single file. Upload the output file to the CMS.

- reports/output/academic-plan-diffs.html
- reports/output/prereq-tree.html
- reports/output/plan-editor.html

```
$ make
```

# Projects

There are a lot of scripts in the top-level directory of this repo, and it's not clear how they're related to each other because file tree viewers tend to alphabetize these file names. `redundant_prereq_check.py` and `redundant_prereq_courses.py` are right next to each other; are they related?

Many files are one-time scripts just to answer a question that someone or I had. How many majors depend on math 18? Which major changed the most over the past few years? Also, for technical reasons ([I don't understand Python modules](https://stackoverflow.com/a/4383597)), I put all the Python files in the root directory so they can import each other.

Below, the files are listed in somewhat chronological order, at least within each list. I think this organization better shows the relationship between the files so that when I clean things up for others to use, it's easier to tell which ones I can toss out.

## Uploading to Curricular Analytics

_2022 June 8 to July 7 (2021 plans), August 2 to (2015–2022 plans). Python._

Task: Upload every major's curriculum and each of its college degree plans to Curricular Analytics.

We approached this using automation rather than manually entering in the plans as other universities did. This involved parsing the given CSVs of all degree plans and majors, then outputting CSVs in the format of Curricular Analytics. A lot of cleanup was necessary to fix prerequisites, clean up messy course names, and correct the number of units for courses. Finally, to expediate uploading all of the plans, I reverse engineered Curricular Analytics' internal API to automate uploading the generated CSVs to the website.

On June 22, I started uploading all the curricula. I had to fix a few things, but I finished on July 3.

On August 2, we were given academic plans from 2012 to 2022; we previously only had plans from 2021. I uploaded all the plans from 2015 on (older plans were deemed too low quality). The Curricular Analytics website wasn't great for navigating this many curricula, so I made a [Tableau view that just had links][curr-idx] to the curriculum for every major and year.

Files:

- **parse.py** parses the input CSV files as Python objects.
- **output.py** takes the Python objects and outputs them as CSV or JSON files to upload to Curricular Analytics.
- **api.py** defines helper methods that interface directly with Curricular Analytics' internal API. Think of it like discord.js but for Curricular Analytics.
  - [Documentation for Curricular Analytics' internal API](./docs/ca-api.md)

Data files:

- **output_json.py** defines Python `TypedDict` objects to define the JSON structure for output.py.
- **departments.py** parses a JSON file containing a list of departments. The department name is included in the curriculum name on Curricular Analytics.
  - (output: departments.txt) As a script, I wanted to check if there were department codes in the degree plan CSV that weren't included in the major code CSV.

This involved additional scripts for error checking:

- compare-curricula.py (output: comparisons.txt) compared, for each major, every college's degree plan (major courses only) against each other, and listed the differences in courses in comparisons.txt. I found that Marshall had the least deviations overall, so Marshall's degree plans are used to create curricula.
- marshall-viability-analysis.py (output: marshall.txt) was a follow-up script that checked that Marshall was the least deviant of all the colleges. It compared Marshall with the degree plans of all the other colleges and printed when it disagreed with every college. It only disagreed with the others twice, which is pretty good.
- course_names.py (output: course_names.txt) listed every unique course title (cleaned up a bit) with its parsed course code. This was to test `parse_course_name` (which turns `BICD110` into `("BICD", "110")` but not `IE1` into `("IE", "1")`) as well as `clean_course_title`.
- course_names2.py (output: course_names2.txt) attempted to clean up course titles more aggressively, mostly to match the example CSV files we were given.
  - However, by removing `GE`, `AWP`, and `DEI`, this ended up removing useful context from the plans. For example, some plans had something like two instances of "MCWP 40/GE," but on Curricular Analytics, this appeared as two MCWP 40 courses, which looks like an error. The rewrite of parse.py does not do this anymore I believe.
- common_prereqs.py (output: common_prereqs.txt) identified common prereqs across all courses in a subject. This was to figure out if there were any exceptions other than the provided `SOCI- UD METHODOLOGY` and `TDHD XXX`.
  - We started with example manually created curricula that defined prerequisites for these course categories, and to make our script match the examples, we just added special cases for those two courses.
- unit_check.py listed degree plans with fewer than 180 units.
- course_names3.py (output: course_names3.txt) runs [Arturo's course name cleanup algorithm](https://www.overleaf.com/project/62e8265ff1395d787286ea5b) on every unique course title, and lists all resulting unique cleaned course titles. The goal with this is to reduce variability in course titles resulting from college advisors phrasing things differently.
  - This supercedes the old aggressive course title cleanup algorithm that was tested by course_names2.py.

Scripts for uploading:

- **upload.py** (output: files/uploaded\*.yml) is a CLI tool that uploads the specified major to Curricular Analytics.
- **update.py** overwrote an already-uploaded curriculum. I ran this if I fixed something in output.py. It uses Curricular Analytics' internal API for editing curricula/degree plans using their visual editor by sending them a JSON file (rather than CSV) of the result.
  - This script isn't very good because Curricular Analytics is kind of buggy. Course IDs are tied between curriculum and degree plans or something because in updated plans, prerequisites specific to a course in one degree plan would bleed into another. Uploading or editing by JSON is also much slower than using a CSV file.
  - Editing is occasionally necessary because you can only delete curricula you created, and we were asked to overwrite the curricula already uploaded by someone else with ones generated by our scripts. Also, if we wanted to fix something now, we probably wouldn't want to break URLs by deleting existing curricula and uploading new ones.
- files/fix.sh was used to update already-uploaded plans for several majors without me having to sit around the terminal waiting for it to load.
- check_uploaded.py checked every major uploaded onto Curricular Analytics. For some reason, if curricula are uploaded too quickly to Curricular Analytics, they end up with blank degree plans. This happened for curricula uploaded earlier before I realized I set the delay time too short.
- rename_all.py renamed every uploaded 2021 curriculum on Curricular Analytics to the new curriculum name format. This was because we were uploading plans for other years now, so the existing curriculum names had to include their year.
- files/upload.sh was used to mass-upload plans for other (non-2021) years.

## Tableau of metrics

_2022 July 7 to August 2. Python, Julia, Tableau._

Task: Create dashboards on Tableau displaying data about courses and majors. On July 20, more specific details were given:

1. View \#1: majors going down, colleges going right. Given a year, select a metric to show in each degree plan's cell, or flag plans that meet specific conditions.
2. View #2: majors going down. Given a college and year, select a metric to show in each row along with its value (e.g. the name of the course with highest complexity).
3. Reports:
   1. Number of plans any course appears in by year.
   2. Complexity for any course by plan and year.
   3. Centrality for any course by plan and year.
   4. Course overlap between majors.

I saw that Arturo was working with Julia, so I began reading its documentation on June 30.

In order to get metrics such as complexity and centrality, Curricular Analytics has a [Julia package](https://github.com/CurricularAnalytics/CurricularAnalytics.jl/). I had to load the plans from Python into Julia. I first got a CSV file for every degree plan, but I decided to rewrite the plan parsing script in Julia (July 20 and 21). The Julia scripts output CSV files that I imported into Tableau. Tableau is quite powerful but also somewhat annoying to fight when I want a visualization (viz) to look a certain way. We were supposed to receive Tableau training, but scheduling was a pain. We had to take a privacy workshop first (where they asked us to move our views from Tableau Public to UCSD's Tableau instance), but by then, we had already figured out Tableau ourselves.

Arturo took over handling the Tableau views, adding additional views (including views for quality control) and blank, data-less templates for other universities to use. We wanted to share views so that some views were public while others remained private to administrators only (since the data may be embarassing to certain departments), but we don't have sharing permissions. It has been over a year, and we still haven't resolved this issue.

Old Tableau view: _Carlos mentioned in a meeting that he wanted a certain Tableau view, so I went ahead and [made it][metrics-old]. This was before he gave more specific details above._

- output_all.py (output: files/output/\*\*/\*.csv) wrote a CSV for every curriculum and degree plan (2021 only).
- metrics.jl (output: files/metrics.csv, files/courses.csv) read these CSVs then created a CSV of each degree plan's metrics.

New Tableau views:

- **Parse.jl** is the Julia equivalent of parse.py.
- **Output.jl** creates `Curriculum` and `DegreePlan` objects for a given year and major.
- Metrics.jl (output: files/metrics_fa12.csv) uses these objects to output a CSV of all the metrics needed for the [Tableau views (#1 and #2)][views] for every year-major-college combination.
  - Not to be confused with lowercase metrics.jl. I don't know why I named it this way, but I guess it was because this supercedes the old metrics.jl. Julia module names are conventionally uppercase, which I learned after writing metrics.jl.
- **Utils.jl** helped to reduce code repetition between Metrics.jl and CourseMetrics.jl for common functions like writing a CSV row.
- CourseMetrics.jl (output: files/courses_fa12.csv) outputs a CSV of every course in every year-major and lists its metrics in the curriculum (based on Marshall's degree plan). This is for [reports #1, #2, and #3][reports].
- CourseOverlap.jl (output: files/course_overlap.csv) lists the percent overlap of courses for every ordered major pair and year, for [report #4][reports]. It's an ordered pair because the way I calculated percent overlap wasn't commutative; it used the first major's number of courses in the denominator of the percentage.
- curricula_index.py (output: files/curricula_index.csv) created a CSV file with the URL of every year-major pair, including the department and school of the major. This was for the [list of uploaded Curricular Analytics curriculum links][curr-idx].
  - I'm listing this here because it's kind of a cross between the plan uploading and Tableau view project (we consider it a Tableau viz).

Unrelated:

- majors_per_course.py (output: files/majors_per_course.csv) lists the number of majors a course shows up in per major. Apparently this has nothing to do with the Tableau views; the math department just wanted to know how many majors depend on math 18.
- redundant_prereq_check.py attempted to identify redundant prereqs. I think this might be to remove unnecessary prereq lines in the degree plans on Curricular Analytics (e.g. an arrow from MATH 20A and MATH 20B to some other course, even though only the arrow from MATH 20B is necessary).

[metrics-old]: https://public.tableau.com/app/profile/sean.yen/viz/metrics_16619827387790/
[views]: https://public.tableau.com/app/profile/sean.yen/viz/metrics_fa12/
[reports]: https://public.tableau.com/app/profile/sean.yen/viz/reports_16591343716100/
[curr-idx]: https://public.tableau.com/app/profile/sean.yen/viz/curriculum_index/

## Systematically flagging issues

_2022 August 18–23. Python._

Task: Systematically flag common issues in UCSD's degree plans (because they are manually created by human college advisors).

At first, these issues were supposed to be raw so the colleges could identify false positives, but after some colleges fixed the issues, the issues were expected to be cleaned up. They're rather pissed that the document is still listing issues they've fixed, but we haven't gotten a data update since last year.

The report used to be in plain text, but I moved it to a Google Doc so it's web accessible (for the advisors).

Files:

- flag_issues.py (output: files/flagged_issues.html) outputs an HTML file that can be copy-pasted into a Google Doc for the advisors.
- units_per_course.py (output: units_per_course.txt, units_per_course.json) identifies the likely correct number of units for a course. This is used as the correct number of units until I get a dataset of units per course (which I have not yet received).
  - However, this isn't very accurate because units of courses can change over time. LTSP 2A seemingly used to be 4 units and now is 5, and all but one college updated their plans to reflect this, but they're all marked wrong because most of the older plans have 4 units.

## Changes to degree plans over time (plan diff)

_2022 August 26–31. Python, Deno/TypeScript/Preact. [Details](https://educationalinnovation.ucsd.edu/ca-views/plan-changes.html), [app](https://educationalinnovation.ucsd.edu/_files/academic-plan-diffs.html)._

I forgot why I made this, but this wasn't a task. I think at some point, I realized that I wanted to see what specific changes occurred to a plan over the years, so I went ahead and made a diffing program. With feedback from Carlos, I made what originally was a fancy CLI tool into a web app. Since I had done the [CMS training](https://blink.ucsd.edu/technology/websites/training/start/access/index.html) (I think this was intended for Tableau), I got access to [educationalinnovation.ucsd.edu](https://educationalinnovation.ucsd.edu/) and was told to upload the web page on there.

Files:

- diff_plan.py pretty-prints the changes made to the given major-college degree plan over the years. Carlos said to make it more presentable for non-techie advisors, so this also outputs a JSON file of diffs for every major-college combo for the web app that I made.
  - It uses files/metrics_fa12.csv (rather than from PlanChanges.jl) to include complexity score changes.
- reports/plan-diffs-template.html - A template HTML file. The Makefile replaces the last few lines with inline script tags containing the JSON of all the plan changes and the bundled code.
- reports/plan-diffs.tsx - The entry point of the Preact app. It's written in TypeScript for Deno and uses Preact, and it's bundled using `deno bundle`, which later got deprecated for some reason.
- Makefile is shared by all web reports and contains the commands to build all web reports just by running `make`.

Unused:

- PlanChanges.jl (output: files/changes.csv, which I imported into a [Google Sheet](https://docs.google.com/spreadsheets/d/1CIz7pCOAduXC-58jixgXlHwYGKCx4k9MX7z51uq0wtQ/)) calculates the amount of change per major-college. I wanted to see which degree plans would have interesting diffs. This is not used anywhere else since diff_plan.py uses Metrics.jl's complexity scores.

## Changes to prerequisites over time (prereq diff)

_2022 September 9–28. Python. [Details](https://educationalinnovation.ucsd.edu/ca-views/prereq-changes.html), [app (by course)](https://educationalinnovation.ucsd.edu/_files/prereq-diffs.html), [app (by term)](https://educationalinnovation.ucsd.edu/_files/prereq-timeline.html)._

Task: list changes to prerequisites and specify which term they were added or removed.

Carlos then wanted to focus on changes one year at a time. This way, you can see when prerequisites are changed in the middle of a year.

Files:

- diff_prereqs.py generates an HTML fragment for the report.
- reports/prereq-diffs-template.html, reports/prereq-timeline-template.html - Contains the CSS for the web page. The Makefile removes the last few lines to insert the HTML fragments generated by `diff_prereqs.py`.
