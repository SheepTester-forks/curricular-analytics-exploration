import os

from dotenv import load_dotenv  # type: ignore
from api import Session
from upload import track_uploaded_curricula

load_dotenv()
ca_session = os.getenv("CA_SESSION")
if ca_session is None:
    raise EnvironmentError("No CA_SESSION environment variable")
session = Session(ca_session)
with track_uploaded_curricula("./files/uploaded.yml") as curricula:
    for major_code, curriculum_id in curricula.items():
        curriculum = session.get_curriculum(curriculum_id)
        if not curriculum["courses"]:
            print(f"{major_code} empty")
        else:
            print(f"{major_code}\r", end="")
        for name, plan_id in session.get_degree_plans(curriculum_id).items():
            degree_plan = session.get_degree_plan(plan_id)
            if len(degree_plan["terms"]) != 12:
                print(f'{major_code} {name} has {len(degree_plan["terms"])} quarters')
