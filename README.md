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
