#!/bin/bash

set -e

cd reports
# https://stackoverflow.com/a/18127758
head -n -2 < plan-diffs-template.html > output/academic-plan-diffs.html
echo '<script id="diffs" type="application/json">' >> output/academic-plan-diffs.html
cat output/academic-plan-diffs.json >> output/academic-plan-diffs.html
echo '</script>' >> output/academic-plan-diffs.html
echo '<script type="module">' >> output/academic-plan-diffs.html
deno bundle plan-diffs.tsx >> output/academic-plan-diffs.html
echo '</script></body></html>' >> output/academic-plan-diffs.html
