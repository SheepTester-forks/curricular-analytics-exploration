/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

export type CustomCourseProps = {
  name: string
  reqs: string[][]
  onName: (name: string) => void
  onReqs: (name: string[][]) => void
  onRemove: () => void
  isNew: boolean
}
export function CustomCourse ({
  name,
  reqs,
  onName,
  onReqs,
  onRemove,
  isNew
}: CustomCourseProps) {
  return (
    <li class='custom-course'>
      <input
        class='custom-course-input'
        type='text'
        placeholder={isNew ? 'Type a course code here' : 'Course code'}
        value={name}
        onInput={e => onName(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.parentElement?.nextElementSibling
              ?.querySelector('input')
              ?.focus()
          } else if (e.key === 'Backspace' && name === '') {
            if (!isNew) {
              onRemove()
            }
            e.currentTarget.parentElement?.previousElementSibling
              ?.querySelector('input')
              ?.focus()
            e.preventDefault()
          }
        }}
      />
      {!isNew && (
        <ol class='custom-course-prereqs'>
          {[...reqs, []].map((alts, i) => (
            <li key={i}>
              <ul class='custom-prereq-alts'>
                {[...alts, ''].map((alt, j) => (
                  <li key={j}>
                    <input
                      class='custom-prereq-input'
                      type='text'
                      list='courses'
                      placeholder={
                        i === reqs.length
                          ? 'New requirement'
                          : j === 0
                          ? 'Prerequsite'
                          : j === alts.length
                          ? 'Add alternate'
                          : 'Alternate'
                      }
                      value={alt}
                      onInput={e =>
                        onReqs(
                          i === reqs.length
                            ? [...reqs, [e.currentTarget.value]]
                            : reqs.map((req, mi) =>
                                mi === i
                                  ? j === alts.length
                                    ? [...req, e.currentTarget.value]
                                    : req.map((alt, mj) =>
                                        mj === j ? e.currentTarget.value : alt
                                      )
                                  : req
                              )
                        )
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.currentTarget.parentElement?.parentElement?.parentElement?.nextElementSibling
                            ?.querySelector('input')
                            ?.focus()
                        } else if (e.key === 'Backspace' && alt === '') {
                          if (j < alts.length) {
                            if (alts.length === 1) {
                              onReqs(reqs.filter((_, mi) => mi !== i))
                            } else {
                              onReqs(
                                reqs.map((req, mi) =>
                                  mi === i
                                    ? req.filter((_, mj) => mj !== j)
                                    : req
                                )
                              )
                            }
                          }
                          if (j === 0) {
                            const element =
                              e.currentTarget.parentElement?.parentElement?.parentElement?.previousElementSibling?.querySelector(
                                'li:last-child input'
                              )
                            if (element instanceof HTMLInputElement) {
                              element.focus()
                            }
                          } else {
                            e.currentTarget.parentElement?.previousElementSibling
                              ?.querySelector('input')
                              ?.focus()
                          }
                          e.preventDefault()
                        }
                      }}
                    />
                    {j < alts.length - 1 && ' OR '}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}
