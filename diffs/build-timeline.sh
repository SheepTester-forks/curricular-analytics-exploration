#!/bin/bash

head -n -1 < diffs/prereq-timeline-template.html > diffs/prereq-timeline.html
python3 diff_prereqs.py timeline >> diffs/prereq-timeline.html
echo '</html>' >> diffs/prereq-timeline.html
