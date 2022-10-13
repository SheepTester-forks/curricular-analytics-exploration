#!/bin/bash

head -n -1 < reports/prereq-diffs-template.html > reports/output/prereq-diffs.html
python3 diff_prereqs.py >> reports/output/prereq-diffs.html
echo '</html>' >> reports/output/prereq-diffs.html
