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
    <ul class='course-adder'>
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
      <li>
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
      </li>
    </ul>
  )
}

function courseUnlocked (reqs: CourseCode[][], taken: CourseCode[]): boolean {
  for (const req of reqs) {
    for (const alt of req) {
      if (taken.includes(alt)) {
        return true
      }
    }
  }
  return false
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
function friction (param: Parameter, reduction: number): void {
  if (param.velocity > 0) {
    param.velocity -= reduction
    if (param.velocity < 0) {
      param.velocity = 0
    }
  } else {
    param.velocity += reduction
    if (param.velocity > 0) {
      param.velocity = 0
    }
  }
}

function normalize (
  x: number,
  y: number
): { x: number; y: number; length: number } {
  const length = Math.hypot(x, y)
  // Arbitrarily make <0, 0> -> <1, 0>
  return {
    x: length === 0 ? 1 : x / length,
    y: length === 0 ? 0 : y / length,
    length
  }
}

const RADIUS = 30
const SPACING = 10
const REPULSION_RADIUS = RADIUS * 2 + SPACING

const REPULSION = 0.02
const FRICTION = 0.02
const WALL_REPULSION = 0.02

const FILL = '#fbbf24'
const TEXT = 'black'
const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
const FONT = `16px ${FONT_FAMILY}`

class Node {
  code: CourseCode
  x: Parameter
  y: Parameter
  connections: CourseCode[] = []
  hovered = false

  constructor (code: CourseCode, x: number, y: number) {
    this.code = code
    this.x = { position: x, velocity: 0, acceleration: 0 }
    this.y = { position: y, velocity: 0, acceleration: 0 }
  }

  simulate (bounds: Bounds): void {
    this.x.acceleration = 0
    this.y.acceleration = 0

    const { x, y, length } = normalize(
      Math.min(this.x.position - (-bounds.width / 2 + RADIUS + SPACING), 0) +
        Math.max(this.x.position - (bounds.width / 2 - RADIUS - SPACING), 0),
      Math.min(this.y.position - (-bounds.height / 2 + RADIUS + SPACING), 0) +
        Math.max(this.y.position - (bounds.height / 2 - RADIUS - SPACING), 0)
    )
    if (length > 0) {
      const strength = length / SPACING
      this.x.acceleration -= strength * WALL_REPULSION * x
      this.y.acceleration -= strength * WALL_REPULSION * y
    }
  }

  interact (other: Node): void {
    const { x, y, length } = normalize(
      this.x.position - other.x.position,
      this.y.position - other.y.position
    )
    if (length < REPULSION_RADIUS) {
      // Apply repelling force proportional to distance to center
      const strength = 1 - length / REPULSION_RADIUS
      const force = strength * REPULSION
      this.x.acceleration += force * x
      this.y.acceleration += force * y
      other.x.acceleration -= force * x
      other.y.acceleration -= force * y
    }
    if (
      !Number.isFinite(this.x.acceleration) ||
      !Number.isFinite(this.y.acceleration)
    ) {
      throw new RangeError('Acceleration is non-finite 😭')
    }
  }

  move (time: number, bounds: Bounds): void {
    this.x.position +=
      (this.x.acceleration * time * time) / 2 + this.x.velocity * time
    this.x.velocity += this.x.acceleration * time
    friction(this.x, time * FRICTION)
    if (this.x.position < -bounds.width / 2 + RADIUS) {
      this.x.position = -bounds.width / 2 + RADIUS
      if (this.x.velocity < 0) {
        this.x.velocity = 0
      }
    } else if (this.x.position > bounds.width / 2 - RADIUS) {
      this.x.position = bounds.width / 2 - RADIUS
      if (this.x.velocity > 0) {
        this.x.velocity = 0
      }
    }

    this.y.position +=
      (this.y.acceleration * time * time) / 2 + this.y.velocity * time
    this.y.velocity += this.y.acceleration * time
    friction(this.y, time * FRICTION)
    if (this.y.position < -bounds.height / 2 + RADIUS) {
      this.y.position = -bounds.height / 2 + RADIUS
      if (this.y.velocity < 0) {
        this.y.velocity = 0
      }
    } else if (this.y.position > bounds.height / 2 - RADIUS) {
      this.y.position = bounds.height / 2 - RADIUS
      if (this.y.velocity > 0) {
        this.y.velocity = 0
      }
    }

    if (
      !Number.isFinite(this.x.position) ||
      !Number.isFinite(this.y.position)
    ) {
      throw new RangeError('Position is non-finite 😭')
    }
  }

  drawNode (context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.moveTo(this.x.position + RADIUS, this.y.position)
    context.arc(this.x.position, this.y.position, RADIUS, 0, Math.PI * 2)
    context.fillStyle = FILL
    context.fill()
    if (this.hovered) {
      context.stroke()
    }
    context.fillStyle = TEXT
    const [subject, number] = this.code.split(' ')
    context.fillText(subject, this.x.position, this.y.position - 6)
    context.fillText(number, this.x.position, this.y.position + 10)
  }

  drawEdges (context: CanvasRenderingContext2D): void {}

  static spawn (code: CourseCode): Node {
    const WIGGLE_RADIUS = 5
    const angle = Math.random() * Math.PI * 2
    return new Node(
      code,
      Math.cos(angle) * WIGGLE_RADIUS,
      Math.sin(angle) * WIGGLE_RADIUS
    )
  }
}

type Bounds = { width: number; height: number }
type State = {
  nodes: Record<CourseCode, Node>
  hovered: Node | null
}
function simulate (state: State, timeStep: number, bounds: Bounds): void {
  const nodes = Object.values(state.nodes)
  for (const node of nodes) {
    node.simulate(bounds)
  }
  for (const [i, node] of nodes.entries()) {
    for (let j = i + 1; j < nodes.length; j++) {
      node.interact(nodes[j])
    }
  }
  for (const node of nodes) {
    node.move(timeStep, bounds)
  }
}
function draw (
  context: CanvasRenderingContext2D,
  state: State,
  width: number,
  height: number
): void {
  context.clearRect(-width / 2, -height / 2, width, height)

  context.font = FONT
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeStyle = 'black'
  context.lineWidth = 2
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
    nodes: {},
    hovered: null
  })

  useEffect(() => {
    if (!canvasRef.current) return
    observerRef.current.observe(canvasRef.current.parentElement!)
  }, [canvasRef.current])

  useEffect(() => {
    if (!canvasRef.current || !size) return
    canvasRef.current.width = size.width
    canvasRef.current.height = size.height

    const context = canvasRef.current.getContext('2d')!
    context.translate(size.width / 2, size.height / 2)
    context.scale(size.scale, size.scale)

    let id: number
    let lastTime = 0
    const render = () => {
      const time = Date.now()
      const timeStep = Math.min(time - lastTime, 50)
      lastTime = time
      simulate(stateRef.current, timeStep, {
        width: size.width / size.scale,
        height: size.height / size.scale
      })
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
    const nodes = [...courses]
    let added = true
    while (added) {
      const unlocked = getUnlockedCourses(prereqs, nodes)
      added = unlocked.length > 0
      nodes.push(...unlocked)
    }

    stateRef.current.nodes = Object.fromEntries(
      nodes.map(course => [
        course,
        stateRef.current.nodes[course] ?? Node.spawn(course)
      ])
    )
  }, [courses])

  return (
    <>
      <div class='canvas-wrapper'>
        <canvas
          class='canvas'
          ref={canvasRef}
          onMouseMove={event => {
            const mouse = {
              x: event.clientX - window.innerWidth / 2,
              y: event.clientY - window.innerHeight / 2
            }
            if (stateRef.current.hovered) {
              stateRef.current.hovered.hovered = false
            }
            for (const node of Object.values(
              stateRef.current.nodes
            ).reverse()) {
              if (
                (mouse.x - node.x.position) ** 2 +
                  (mouse.y - node.y.position) ** 2 <=
                RADIUS ** 2
              ) {
                stateRef.current.hovered = node
                node.hovered = true
                event.currentTarget.style.cursor = 'pointer'
                return
              }
            }
            stateRef.current.hovered = null
            event.currentTarget.style.cursor = ''
          }}
        />
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
