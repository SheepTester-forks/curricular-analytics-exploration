from output import MajorOutput
from parse import major_plans


for major_code, plan in major_plans(2021).items():
    output = MajorOutput(plan)
    for college in output.plans.plans.keys():
        plan = output.output_json(college)
        units = sum(
            item["credits"]
            for term in plan["curriculum_terms"]
            for item in term["curriculum_items"]
        )
        if units < 180:
            print(f"{major_code} {college} {units}")
