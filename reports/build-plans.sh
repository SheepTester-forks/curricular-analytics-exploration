#!/bin/bash

cd diffs
# https://stackoverflow.com/a/18127758
head -n -2 < plan-diffs-template.html > academic-plan-diffs.html
echo '<script id="diffs" type="application/json">' >> academic-plan-diffs.html
cat academic-plan-diffs.json >> academic-plan-diffs.html
echo '</script>' >> academic-plan-diffs.html
echo '<script type="module">' >> academic-plan-diffs.html
deno bundle plan-diffs.tsx >> academic-plan-diffs.html
echo '</script></body></html>' >> academic-plan-diffs.html
