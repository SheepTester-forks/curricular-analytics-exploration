module Parse

import CurricularAnalytics

export CourseCode

const CourseCode = Tuple{String,String}

function parsefield(field::String)
  if length(field) > 0 && field[1] == '"'
    field = replace(field[2:end-1], "\"\"" => "\"")
  end
  return strip(field)
end

function parsecsv(io::IO)
  rows = Vector{String}[]
  row_overflow = nothing
  for line in eachline(io, keep=true)
    row = String[]
    in_quotes = false
    if row_overflow !== nothing
      row = row_overflow.row
      in_quotes = true
    else
      row = String[]
      push!(rows, row)
    end
    last_index = 1
    for (i, char) in enumerate(line * ",")
      if in_quotes
        if char == '"'
          in_quotes = false
        end
      elseif char == '"'
        in_quotes = true
      elseif char == ','
        prefix = if row_overflow !== nothing
          row_overflow.overflow
        else
          ""
        end
        row_overflow = nothing
        push!(row, parsefield(prefix * line[last_index:i-1]))
        last_index = i + 1
      end
    end
    if in_quotes
      prefix = if row_overflow !== nothing
        row_overflow.overflow
      else
        ""
      end
      row_overflow = (row=row, overflow=prefix * line[last_index:end] + "\n")
    end
  end
  rows
end

function get_prereqs()
  terms = Dict{String,Dict{CourseCode,Vector{Vector{CourseCode}}}}()
  for (
    term, # Term Code
    _, # Term ID
    _, # Course ID
    sub, # Course Subject Code
    num, # Course Number
    req_seq, # Prereq Sequence ID
    _, # Prereq Course ID
    req_sub, # Prereq Subject Code
    req_num, # Prereq Course Number
    _, # Prereq Minimum Grade Priority
    _, # Prereq Minimum Grade
    _, # Allow concurrent registration (TODO: can I ignore this?)
  ) in open(parsecsv, "./files/prereqs_fa12.csv")[2:end]
    if req_seq == ""
      continue
    end
    courses = get!(terms, term, Dict())
    prereqs = get!(courses, (sub, num), [])
    req_seq = parse(Int, req_seq)
    while req_seq > length(prereqs)
      push!(prereqs, [])
    end
    push!(prereqs[req_seq], (req_sub, req_num))
  end
  terms
end

print(get_prereqs()["FA21"])

end
