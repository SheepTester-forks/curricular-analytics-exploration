"""
Update names for all the curricula to add years to them.
"""

from parse import major_codes
from upload import MajorUploader, track_uploaded_curricula

session = MajorUploader()
year = 2021

with track_uploaded_curricula("./files/uploaded.yml") as curricula:
    for major_code, curriculum_id in curricula.items():
        name = f"{year} {major_code}-{major_codes()[major_code].name}"
        print(name)
        session.edit_curriculum_metadata(curriculum_id, name=name)
