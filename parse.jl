module Parse

import CurricularAnalytics

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

print(open(parsecsv, "./files/out.csv"))

end
