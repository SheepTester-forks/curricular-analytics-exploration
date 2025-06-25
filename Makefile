all: tableau academic-plan-diffs prereq-diffs prereq-timeline college-ge-units prereq-tree plan-editor-index flagged-issues
protected: files/protected/summarize_dfw_by_major.json files/protected/summarize_frequency.json

year-start = 2015
year = 2024
prereq-term = WI25
# Make sure to update the file paths in university.py as well
prereqs = files/2024_prereqs_thruFA25.csv
plans = files/2024_academic_plans_thruFA24.csv
majors = files/isis_major_code_list.csv

# Reports

tableau: files/metrics_fa12_py.csv files/courses_fa12_py.csv files/course_overlap_py.csv files/curricula_index.csv
academic-plan-diffs: reports/output/academic-plan-diffs.html
prereq-diffs: reports/output/prereq-diffs.html
prereq-timeline: reports/output/prereq-timeline.html
college-ge-units: reports/output/college-ge-units.html
prereq-tree: reports/output/prereq-tree.html
plan-editor: reports/output/plan-editor.html
plan-editor-index: reports/output/plan-editor-index.html reports/output/plan-graph-index.html plan_csvs/metadata.json
seats: reports/output/seats.html
flagged-issues: files/flagged_issues.html

# Clean

clean:
	rm -f reports/output/*.js reports/output/*.json reports/output/*.html reports/output/*.map
	rm -rf files/prereqs/ files/plans/
	rm -f files/metrics_fa12_py.csv files/courses_fa12_py.csv files/course_overlap_py.csv files/curricula_index.csv
	rm -f courses_req_by_majors.json
	rm -f files/protected/*.json

# make split
split: files/prereqs/.done files/plans/.done

files/prereqs/.done: $(prereqs)
	python3 split_csv.py prereqs $(prereqs)

files/plans/.done: $(plans)
	python3 split_csv.py plans $(plans)

# Tableau

files/metrics_fa12_py.csv: plan_metrics.py files/prereqs/.done files/plans/.done
	python3 plan_metrics.py

files/courses_fa12_py.csv: course_metrics.py files/prereqs/.done files/plans/.done
	python3 course_metrics.py

files/course_overlap_py.csv: course_overlap.py files/plans/.done
	python3 course_overlap.py

files/curricula_index.csv: curricula_index.py files/uploaded*.yml
	python3 curricula_index.py $(year-start) $(year) > files/curricula_index.csv

# Plan diffs

reports/output/academic-plan-diffs.json: files/metrics_fa12_py.csv diff_plan.py files/plans/.done $(majors)
	python3 diff_plan.py $(year-start) $(year) > reports/output/academic-plan-diffs.json

reports/output/plan-diffs.js: reports/plan-diffs/index.tsx reports/output/academic-plan-diffs.json
	npm run build plan-diffs

reports/output/academic-plan-diffs.html: reports/plan-diffs/template.html reports/output/plan-diffs.js
	head -n $$(($$(wc -l < reports/plan-diffs/template.html) - 3)) < reports/plan-diffs/template.html > reports/output/academic-plan-diffs.html
	echo '<script>' >> reports/output/academic-plan-diffs.html
	cat reports/output/plan-diffs.js >> reports/output/academic-plan-diffs.html
	echo '</script></body></html>' >> reports/output/academic-plan-diffs.html

# Prereq diffs

reports/output/prereq-diffs-fragment.html: diff_prereqs.py files/prereqs/.done
	python3 diff_prereqs.py > reports/output/prereq-diffs-fragment.html

reports/output/prereq-diffs.html: reports/prereq-diffs-template.html reports/output/prereq-diffs-fragment.html
	head -n $$(($$(wc -l < reports/prereq-diffs-template.html) - 1)) < reports/prereq-diffs-template.html > reports/output/prereq-diffs.html
	cat reports/output/prereq-diffs-fragment.html >> reports/output/prereq-diffs.html
	echo '</html>' >> reports/output/prereq-diffs.html

# Prereq timeline

reports/output/prereq-timeline-fragment.html: diff_prereqs.py files/prereqs/.done
	python3 diff_prereqs.py timeline > reports/output/prereq-timeline-fragment.html

reports/output/prereq-timeline.html: reports/prereq-timeline-template.html reports/output/prereq-timeline-fragment.html
	head -n $$(($$(wc -l < reports/prereq-timeline-template.html) - 1)) < reports/prereq-timeline-template.html > reports/output/prereq-timeline.html
	cat reports/output/prereq-timeline-fragment.html >> reports/output/prereq-timeline.html
	echo '</html>' >> reports/output/prereq-timeline.html

# College GEs

reports/output/college-ge-units-fragment.html: college_ges.py files/plans/.done $(majors)
	python3 college_ges.py $(year) html > reports/output/college-ge-units-fragment.html

reports/output/college-ge-units.html: reports/college-ge-template.html reports/output/college-ge-units-fragment.html
	head -n $$(($$(wc -l < reports/college-ge-template.html) - 2)) < reports/college-ge-template.html > reports/output/college-ge-units.html
	cat reports/output/college-ge-units-fragment.html >> reports/output/college-ge-units.html
	echo '</body></html>' >> reports/output/college-ge-units.html

# Prereq tree

reports/output/prereqs.json: dump_prereqs.py files/prereqs/.done
	python3 dump_prereqs.py $(prereq-term)

reports/output/prereq-tree.js: reports/prereq-tree/index.tsx reports/output/prereqs.json
	npm run build prereq-tree

reports/output/prereq-tree.html: reports/prereq-tree/template.html reports/output/prereq-tree.js
	head -n $$(($$(wc -l < reports/prereq-tree/template.html) - 3)) < reports/prereq-tree/template.html > reports/output/prereq-tree.html
	echo '<script>' >> reports/output/prereq-tree.html
	cat reports/output/prereq-tree.js >> reports/output/prereq-tree.html
	echo '</script></body></html>' >> reports/output/prereq-tree.html

# Plan editor

reports/output/plan-editor.js: reports/plan-editor/index.tsx reports/output/prereqs.json
	npm run build plan-editor

reports/output/plan-editor.html: reports/plan-editor/template.html reports/output/plan-editor.js
	head -n $$(($$(wc -l < reports/plan-editor/template.html) - 3)) < reports/plan-editor/template.html > reports/output/plan-editor.html
	echo '<script>' >> reports/output/plan-editor.html
	cat reports/output/plan-editor.js >> reports/output/plan-editor.html
	echo '</script></body></html>' >> reports/output/plan-editor.html

# Plan editor index

reports/output/plan-editor-index-fragment.html: dump_plans.py files/plans/.done
	python3 dump_plans.py $(year) html > reports/output/plan-editor-index-fragment.html

reports/output/plan-editor-index.html: reports/plan-editor-index-template.html reports/output/plan-editor-index-fragment.html
	head -n $$(($$(wc -l < reports/plan-editor-index-template.html) - 1)) < reports/plan-editor-index-template.html > reports/output/plan-editor-index.html
	cat reports/output/plan-editor-index-fragment.html >> reports/output/plan-editor-index.html
	echo '</html>' >> reports/output/plan-editor-index.html

plan_csvs/metadata.json: dump_graphs.py files/prereqs/.done files/plans/.done
	python3 dump_graphs.py files

reports/output/plan-graph-index-fragment.html: dump_graphs.py files/plans/.done
	python3 dump_graphs.py html for_public > reports/output/plan-graph-index-fragment.html

reports/output/plan-graph-index.html: reports/plan-graph-index-template.html reports/output/plan-graph-index-fragment.html
	head -n $$(($$(wc -l < reports/plan-graph-index-template.html) - 1)) < reports/plan-graph-index-template.html > reports/output/plan-graph-index.html
	cat reports/output/plan-graph-index-fragment.html >> reports/output/plan-graph-index.html
	echo '</html>' >> reports/output/plan-graph-index.html

reports/output/plan-graph-index-local-fragment.html: dump_graphs.py files/plans/.done
	python3 dump_graphs.py html > reports/output/plan-graph-index-local-fragment.html

reports/output/index-local.html: reports/plan-graph-index-template.html reports/output/plan-graph-index-local-fragment.html
	head -n $$(($$(wc -l < reports/plan-graph-index-template.html) - 1)) < reports/plan-graph-index-template.html > reports/output/index-local.html
	cat reports/output/plan-graph-index-local-fragment.html >> reports/output/index-local.html
	echo '</html>' >> reports/output/index-local.html

# make a local version for carlos so he can show this off when he's not at ucsd
files/plan-graph-local.zip: reports/output/index-local.html ../curricular-analytics-graph/dist/plan-graph.html
	rm -f files/plan-graph-local.zip
	# -j makes it drop the folder parts of the path
	zip files/plan-graph-local.zip reports/output/index-local.html ../curricular-analytics-graph/dist/plan-graph.html -j

# Seats (unused)

courses_req_by_majors.json: courses_req_by_majors.py
	python3 courses_req_by_majors.py $(year) json | prettier --parser=json --no-config > courses_req_by_majors.json

reports/output/seats.js: reports/plan-editor/index.tsx courses_req_by_majors.json
	npm run build seats

reports/output/seats.html: reports/seats/template.html reports/output/seats.js
	head -n $$(($$(wc -l < reports/seats/template.html) - 3)) < reports/seats/template.html > reports/output/seats.html
	echo '<script>' >> reports/output/seats.html
	cat reports/output/seats.js >> reports/output/seats.html
	echo '</script></body></html>' >> reports/output/seats.html

# Flagged issues

units_per_course.json: units_per_course.py
	python3 units_per_course.py json > units_per_course.json

files/flagged_issues.html: flag_issues.py units_per_course.json
	python3 flag_issues.py $(year) > files/flagged_issues.html

# Protected data

scrape_instructor_grade_archive.csv: scrape_instructor_grade_archive.py
	python scrape_instructor_grade_archive.py

files/protected/summarize_dfw_by_major.json: summarize_metrics.mts files/CA_MetricsforMap_FINAL(Metrics).csv $(majors) scrape_instructor_grade_archive.csv
	# Year is cut-off for "old" professors, used for files/summarize_dfw_public.json
	node --experimental-strip-types summarize_metrics.mts 2023

files/protected/summarize_frequency.json: summarize_frequency.py files/21-22\ Enrollment_DFW\ CJ.xlsx.csv files/Waitlist\ by\ Course\ for\ CJ.xlsx.csv
	python3 summarize_frequency.py './files/21-22 Enrollment_DFW CJ.xlsx.csv' './files/Waitlist by Course for CJ.xlsx.csv' > files/protected/summarize_frequency.json
