from output import MajorOutput
from parse import major_plans


for major_code in major_plans.keys():
    output = MajorOutput(major_code)
    for college in output.plans.plans.keys():
        plan = output.output_json(college)
        units = sum(
            item["credits"]
            for term in plan["curriculum_terms"]
            for item in term["curriculum_items"]
        )
        if units < 180:
            print(f"{major_code} {college} {units}")
