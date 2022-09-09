head -n -2 < diffs/prereq-diffs-template.html > diffs/prereq-diffs.html
python3 diff_prereqs.py >> diffs/prereq-diffs.html
echo '</body></html>' >> diffs/prereq-diffs.html
