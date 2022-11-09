/** @jsxImportSource https://esm.sh/preact@10.11.2 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.11.2'
import {
  useEffect,
  useRef,
  useState
} from 'https://esm.sh/preact@10.11.2/hooks'

type CourseCode = string
type Prereqs = Record<CourseCode, CourseCode[][]>

type CourseAdderProps = {
  courseCodes: CourseCode[]
  selected: CourseCode[]
  onSelected: (selected: CourseCode[]) => void
}
function CourseAdder ({ courseCodes, selected, onSelected }: CourseAdderProps) {
  const [query, setQuery] = useState('')

  const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
  const queryValid =
    courseCodes.includes(courseCode) && !selected.includes(courseCode)

  return (
    <div class='course-adder'>
      <ul class='added-courses'>
        {selected.map(courseCode => (
          <li key={courseCode} class='added-course'>
            {courseCode}
            <button
              class='remove-course'
              onClick={() => {
                onSelected(selected.filter(code => code !== courseCode))
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        class='course-adder-form'
        onSubmit={e => {
          const courseCode = query.toUpperCase().trim().replace(/\s+/, ' ')
          if (courseCodes.includes(courseCode)) {
            if (!selected.includes(courseCode)) {
              onSelected([...selected, courseCode])
            }
            setQuery('')
          }
          e.preventDefault()
        }}
      >
        <input
          class='add-course'
          type='search'
          name='course-code'
          list='courses'
          placeholder='Search for a course'
          autofocus
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
          }}
        />
        <input
          class='add-btn'
          type='submit'
          value='Add'
          disabled={!queryValid}
        />
      </form>
      <datalist id='courses'>
        {courseCodes.map(code => (
          <option value={code} key={code} />
        ))}
      </datalist>
    </div>
  )
}

function courseUnlocked (reqs: CourseCode[][], taken: CourseCode[]): boolean {
  reqs: for (const req of reqs) {
    for (const alt of req) {
      if (taken.includes(alt)) {
        continue reqs
      }
    }
    return false
  }
  return true
}

function getUnlockedCourses (
  prereqs: Prereqs,
  taken: CourseCode[]
): CourseCode[] {
  const newCourses: CourseCode[] = []
  for (const [courseCode, reqs] of Object.entries(prereqs)) {
    // Skip classes that are unlocked by default
    if (reqs.length === 0) {
      continue
    }
    if (!taken.includes(courseCode) && courseUnlocked(reqs, taken)) {
      newCourses.push(courseCode)
    }
  }
  return newCourses
}

type Parameter = {
  position: number
  velocity: number
  acceleration: number
}

class Node {
  static #RADIUS = 40

  name: string
  x: Parameter
  y: Parameter
  connections: CourseCode[] = []

  constructor (name: string, x: number, y: number) {
    this.name = name
    this.x = { position: x, velocity: 0, acceleration: 0 }
    this.y = { position: y, velocity: 0, acceleration: 0 }
  }

  simulate (nodes: Record<CourseCode, Node>): void {
    //
  }

  move (time: number): void {
    this.x.position +=
      (this.x.acceleration * time * time) / 2 + this.x.velocity * time
    this.x.velocity += this.x.acceleration * time
    this.y.position +=
      (this.y.acceleration * time * time) / 2 + this.y.velocity * time
    this.y.velocity += this.y.acceleration * time
  }

  drawNode (context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.moveTo(this.x.position + Node.#RADIUS, this.y.position)
    context.arc(this.x.position, this.y.position, Node.#RADIUS, 0, Math.PI * 2)
    context.fillStyle = '#0891b2'
    context.fill()
    context.stroke()
    context.fillStyle = 'white'
    context.fillText(this.name, this.x.position, this.y.position)
  }

  drawEdges (context: CanvasRenderingContext2D): void {}
}

type State = {
  nodes: Record<CourseCode, Node>
}

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
function draw (
  context: CanvasRenderingContext2D,
  state: State,
  width: number,
  height: number
): void {
  context.clearRect(-width / 2, -height / 2, width, height)

  context.font = `16px ${FONT}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeStyle = '#164e63'
  context.lineWidth = 3
  for (const node of Object.values(state.nodes)) {
    node.drawNode(context)
  }
}

type Size = {
  width: number
  height: number
  scale: number
}
type TreeProps = {
  prereqs: Prereqs
  courses: CourseCode[]
}
function Tree ({ prereqs, courses }: TreeProps) {
  const [size, setSize] = useState<Size | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const observerRef = useRef(
    new ResizeObserver(entries => {
      const { inlineSize: contentWidth } = entries[0].contentBoxSize[0]
      const { blockSize: height, inlineSize: width } =
        entries[0].devicePixelContentBoxSize[0]
      setSize({ width, height, scale: width / contentWidth })
    })
  )
  const stateRef = useRef<State>({
    nodes: {}
  })

  const levels = [courses]
  while (levels[levels.length - 1].length > 0) {
    levels.push(getUnlockedCourses(prereqs, levels.flat()))
  }

  useEffect(() => {
    if (!canvasRef.current) return
    observerRef.current.observe(canvasRef.current.parentElement!)
  }, [canvasRef.current])

  useEffect(() => {
    if (!canvasRef.current || !size) return
    canvasRef.current.width = size.width
    canvasRef.current.height = size.height

    const context = canvasRef.current.getContext('2d')!
    context.scale(size.scale, size.scale)
    context.translate(size.width / 2, size.height / 2)

    let id: number
    const render = () => {
      draw(
        context,
        stateRef.current,
        size.width / size.scale,
        size.height / size.scale
      )

      id = requestAnimationFrame(render)
    }
    render()
    return () => {
      cancelAnimationFrame(id)
    }
  }, [canvasRef.current, size])

  useEffect(() => {
    stateRef.current.nodes = Object.fromEntries(
      courses.map(course => [
        course,
        stateRef.current.nodes[course] ?? new Node(course, 0, 0)
      ])
    )
  }, [courses])

  return (
    <>
      <ol>
        {levels.map((level, i) => (
          <li key={i}>
            {level.map(course => (
              <span key={course}> &middot; {course}</span>
            ))}
          </li>
        ))}
      </ol>
      <div class='canvas-wrapper'>
        <canvas class='canvas' ref={canvasRef} />
      </div>
    </>
  )
}

type AppProps = {
  prereqs: Prereqs
}
function App ({ prereqs }: AppProps) {
  const [courses, setCourses] = useState<string[]>([])

  return (
    <>
      <CourseAdder
        courseCodes={Object.keys(prereqs)}
        selected={courses}
        onSelected={setCourses}
      />
      <Tree prereqs={prereqs} courses={courses} />
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
  />,
  document.getElementById('root')!
)
