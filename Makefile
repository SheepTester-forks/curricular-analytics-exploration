all: academic-plan-diffs prereq-diffs prereq-timeline college-ge-units prereq-tree plan-editor

# Reports
academic-plan-diffs: reports/output/academic-plan-diffs.html
prereq-diffs: reports/output/prereq-diffs.html
prereq-timeline: reports/output/prereq-timeline.html
college-ge-units: reports/output/college-ge-units.html
prereq-tree: reports/output/prereq-tree.html
plan-editor: reports/output/plan-editor.html

# Plan diffs

files/metrics_fa12.csv: Metrics.jl files/prereqs_fa12.csv files/academic_plans_fa12.csv
	julia Metrics.jl

reports/output/academic-plan-diffs.json: files/metrics_fa12.csv diff_plan.py files/academic_plans_fa12.csv files/isis_major_code_list.xlsx\ -\ Major\ Codes.csv
	python3 diff_plan.py > reports/output/academic-plan-diffs.json

reports/output/academic-plan-diffs.html: reports/plan-diffs-template.html reports/output/academic-plan-diffs.json reports/plan-diffs.tsx
	head -n -2 < reports/plan-diffs-template.html > reports/output/academic-plan-diffs.html
	echo '<script id="diffs" type="application/json">' >> reports/output/academic-plan-diffs.html
	cat reports/output/academic-plan-diffs.json >> reports/output/academic-plan-diffs.html
	echo '</script>' >> reports/output/academic-plan-diffs.html
	echo '<script type="module">' >> reports/output/academic-plan-diffs.html
	deno bundle reports/plan-diffs.tsx >> reports/output/academic-plan-diffs.html
	echo '</script></body></html>' >> reports/output/academic-plan-diffs.html

# Prereq diffs

reports/output/prereq-diffs-fragment.html: diff_prereqs.py files/prereqs_fa12.csv
	python3 diff_prereqs.py > reports/output/prereq-diffs-fragment.html

reports/output/prereq-diffs.html: reports/prereq-diffs-template.html reports/output/prereq-diffs-fragment.html
	head -n -1 < reports/prereq-diffs-template.html > reports/output/prereq-diffs.html
	cat reports/output/prereq-diffs-fragment.html >> reports/output/prereq-diffs.html
	echo '</html>' >> reports/output/prereq-diffs.html

# Prereq timeline

reports/output/prereq-timeline-fragment.html: diff_prereqs.py files/prereqs_fa12.csv
	python3 diff_prereqs.py timeline > reports/output/prereq-timeline-fragment.html

reports/output/prereq-timeline.html: reports/prereq-timeline-template.html reports/output/prereq-timeline-fragment.html
	head -n -1 < reports/prereq-timeline-template.html > reports/output/prereq-timeline.html
	cat reports/output/prereq-timeline-fragment.html >> reports/output/prereq-timeline.html
	echo '</html>' >> reports/output/prereq-timeline.html

# College GEs

reports/output/college-ge-units-fragment.html: college_ges.py files/academic_plans_fa12.csv files/isis_major_code_list.xlsx\ -\ Major\ Codes.csv
	python3 college_ges.py html > reports/output/college-ge-units-fragment.html

reports/output/college-ge-units.html: reports/college-ge-template.html reports/output/college-ge-units-fragment.html
	head -n -2 < reports/college-ge-template.html > reports/output/college-ge-units.html
	cat reports/output/college-ge-units-fragment.html >> reports/output/college-ge-units.html
	echo '</body></html>' >> reports/output/college-ge-units.html

# Prereq tree

reports/output/prereqs.json: dump_prereqs.py files/prereqs_fa12.csv
	python3 dump_prereqs.py FA22

reports/output/prereqs.js: reports/output/prereqs.json
	echo 'window.PREREQS =' > reports/output/prereqs.js
	cat reports/output/prereqs.json >> reports/output/prereqs.js

reports/output/prereq-tree.js: reports/prereq-tree.tsx
	deno bundle reports/prereq-tree.tsx -- reports/output/prereq-tree.js

reports/output/prereq-tree.html: reports/prereq-tree-template.html reports/output/prereq-tree.js reports/output/prereqs.json
	head -n -4 < reports/prereq-tree-template.html > reports/output/prereq-tree.html
	echo '<script id="prereqs" type="application/json">' >> reports/output/prereq-tree.html
	cat reports/output/prereqs.json >> reports/output/prereq-tree.html
	echo '</script>' >> reports/output/prereq-tree.html
	echo '<script type="module">' >> reports/output/prereq-tree.html
	cat reports/output/prereq-tree.js >> reports/output/prereq-tree.html
	echo '</script></body></html>' >> reports/output/prereq-tree.html

# Plan editor

reports/output/plan-editor.js: reports/plan-editor.tsx
	deno bundle reports/plan-editor.tsx -- reports/output/plan-editor.js

reports/output/plan-editor.html: reports/plan-editor-template.html reports/output/plan-editor.js reports/output/prereqs.json
	head -n -4 < reports/plan-editor-template.html > reports/output/plan-editor.html
	echo '<script id="prereqs" type="application/json">' >> reports/output/plan-editor.html
	cat reports/output/prereqs.json >> reports/output/plan-editor.html
	echo '</script>' >> reports/output/plan-editor.html
	echo '<script type="module">' >> reports/output/plan-editor.html
	cat reports/output/plan-editor.js >> reports/output/plan-editor.html
	echo '</script></body></html>' >> reports/output/plan-editor.html
