## Curriculum diffs

Requires files/prereqs_fa12.csv and files/academic_plans_fa12.csv.

```sh
# make files/metrics_fa12.csv
$ julia Metrics.jl

# make diffs/diffs.json
$ python3 diff_plan.py > diffs/diffs.json

# make index.html (requires Deno)
$ bash diffs/build.sh
```

index.html is entirely self-contained and can be opened in the browser and
uploaded anywhere.

## Prerequisite diffs

Requires files/prereqs_fa12.csv.

```sh
# make prereqs-diffs.html (requires Deno)
$ bash diffs/build-prereqs.sh
```
