#!/bin/bash

head -n -1 < reports/prereq-timeline-template.html > reports/output/prereq-timeline.html
python3 diff_prereqs.py timeline >> reports/output/prereq-timeline.html
echo '</html>' >> reports/output/prereq-timeline.html
