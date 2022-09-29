#!/bin/bash

head -n -1 < reports/prereq-timeline-template.html > reports/prereq-timeline.html
python3 diff_prereqs.py timeline >> reports/prereq-timeline.html
echo '</html>' >> reports/prereq-timeline.html
