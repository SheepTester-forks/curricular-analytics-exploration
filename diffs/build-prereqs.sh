#!/bin/bash

head -n -1 < diffs/prereq-diffs-template.html > diffs/prereq-diffs.html
python3 diff_prereqs.py >> diffs/prereq-diffs.html
echo '</html>' >> diffs/prereq-diffs.html
