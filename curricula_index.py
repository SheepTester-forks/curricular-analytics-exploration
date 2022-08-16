from upload import track_uploaded_curricula

print("Year,Major,URL")

for year in range(2015, 2023):
    with track_uploaded_curricula(year) as curricula:
        for major_code, curriculum_id in curricula.items():
            print(
                ",".join(
                    [
                        str(year),
                        major_code,
                        f"https://curricularanalytics.org/curriculums/{curriculum_id}",
                    ]
                )
            )
