#!/bin/bash

head -n -1 < reports/prereq-diffs-template.html > reports/prereq-diffs.html
python3 diff_prereqs.py >> reports/prereq-diffs.html
echo '</html>' >> reports/prereq-diffs.html
