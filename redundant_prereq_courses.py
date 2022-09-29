from parse import prereqs


course_codes = prereqs("FA22").items()

# 1. Traverse each course's prerequisites to note down what courses a student
#    must've taken
# 2. Of the course's direct prerequisites, if they show up in a different
#    prereq's descendants, then it is redundant.
# 3. TODO: What about lists of alternative courses? I could keep them as ORs,
#    then if there is a partial match then I could flag them differently.
