#!/bin/bash

head -n -2 < reports/college-ge-template.html > reports/output/college-ge-units.html
python3 college_ges.py html >> reports/output/college-ge-units.html
echo '</body></html>' >> reports/output/college-ge-units.html
