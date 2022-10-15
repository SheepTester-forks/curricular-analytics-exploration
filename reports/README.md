All produced HTML files are entirely self-contained and can be opened in the
browser and uploaded anywhere.

## Curriculum diffs

Requires `files/prereqs_fa12.csv` and `files/academic_plans_fa12.csv`.

```sh
# make files/metrics_fa12.csv
$ julia Metrics.jl

# make reports/output/academic-plan-diffs.json
$ python3 diff_plan.py > reports/output/academic-plan-diffs.json

# make academic-plan-diffs.html (requires Deno)
$ bash reports/build-plans.sh
```

## Prerequisite diffs

Requires `files/prereqs_fa12.csv`.

```sh
# make reports/output/prereq-diffs.html (requires Python)
$ bash reports/build-prereqs.sh
```

## Prerequisite diff timeline

Requires `files/prereqs_fa12.csv`.

```sh
# make reports/output/prereq-timeline.html (requires Python)
$ bash reports/build-timeline.sh
```

## GE units by college

Requires `files/academic_plans_fa12.csv` and `files/isis_major_code_list.xlsx - Major Codes.csv`.

```sh
# make reports/output/college-ge-units.html (requires Python)
$ bash reports/build-ges.sh
```
