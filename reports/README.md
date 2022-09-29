All produced HTML files are entirely self-contained and can be opened in the
browser and uploaded anywhere.

## Curriculum diffs

Requires files/prereqs_fa12.csv and files/academic_plans_fa12.csv.

```sh
# make files/metrics_fa12.csv
$ julia Metrics.jl

# make reports/diffs.json
$ python3 diff_plan.py > reports/academic-plan-diffs.json

# make academic-plan-diffs.html (requires Deno)
$ bash reports/build-plans.sh
```

## Prerequisite diffs

Requires files/prereqs_fa12.csv.

```sh
# make prereq-diffs.html (requires Deno)
$ bash reports/build-prereqs.sh
```

## Prerequisite diff timeline

Requires files/prereqs_fa12.csv.

```sh
# make prereq-timeline.html (requires Deno)
$ bash reports/build-timeline.sh
```
