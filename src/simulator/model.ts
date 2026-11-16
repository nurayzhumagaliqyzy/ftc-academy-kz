import type { Direction, Point } from '../programming/integratedModel'

export type { Direction, Point }
export type Mode = 'teleop' | 'autonomous'
export const maxCommands = 48
export const ticksPerStep = 100
export const maxTrail = 240
export const commands = {
  forward: 'Move Forward · алға',
  backward: 'Move Backward · артқа',
  left: 'Turn Left 90° · солға',
  right: 'Turn Right 90° · оңға',
  open: 'Open Claw · ашу',
  close: 'Close Claw · жабу',
  read: 'Read Distance · қашықтықты оқу',
  ifObstacle: 'IF-OBSTACLE · шартты әрекет',
  stop: 'Stop · тоқтату',
} as const
export type Command = keyof typeof commands
export const field = {
  width: 6, height: 6,
  start: { x: 0, y: 5 }, direction: 'E' as Direction,
  object: { x: 2, y: 5 }, zone: { x: 5, y: 1 },
  walls: [{ x: 3, y: 5 }, { x: 3, y: 4 }, { x: 1, y: 2 }, { x: 4, y: 2 }],
} as const
export const directions: readonly Direction[] = ['N', 'E', 'S', 'W']
const vectors: Record<Direction, Point> = { N: { x: 0, y: -1 }, E: { x: 1, y: 0 }, S: { x: 0, y: 1 }, W: { x: -1, y: 0 } }
export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y
export const simulatorRoute = (hash: string) => hash === 'simulator'
export const isCommand = (value: unknown): value is Command => typeof value === 'string' && Object.hasOwn(commands, value)
export const blockedAt = (p: Point) => !Number.isInteger(p.x) || !Number.isInteger(p.y) ||
  p.x < 0 || p.y < 0 || p.x >= field.width || p.y >= field.height || field.walls.some(w => samePoint(w, p))
export type Robot = {
  position: Point; direction: Direction; claw: 'open' | 'closed'
  object: { status: 'ground' | 'carried' | 'delivered'; position: Point }
  moves: number; ticks: number; trail: Point[]
  observation?: { position: Point; direction: Direction; cells: number }
}
export type Status = 'idle' | 'running' | 'paused' | 'finished' | 'stopped' | 'blocked' | 'error'
export type SimulatorState = {
  mode: Mode; robot: Robot; program: Command[]
  status: Status; nextIndex: number; lastIndex?: number; lastCommand?: Command; message: string
}
export const statusLabels: Record<Status, string> = {
  idle: 'Дайын', running: 'Орындалуда', paused: 'Үзіліс', finished: 'Тізім аяқталды',
  stopped: 'Тоқтатылды', blocked: 'Қозғалыс бұғатталды', error: 'Пәрмен қатесі',
}
export function initialRobot(): Robot {
  return { position: { ...field.start }, direction: field.direction, claw: 'closed',
    object: { status: 'ground', position: { ...field.object } }, moves: 0, ticks: 0, trail: [{ ...field.start }] }
}
export function initialSimulator(mode: Mode = 'teleop'): SimulatorState {
  return { mode, robot: initialRobot(), program: [], status: 'idle', nextIndex: 0,
    message: 'Еркін зертхана. Алға бір қадам жасап көр немесе Autonomous тізімін құрастыр. Бұл бөлім баға қоймайды.' }
}
export function distanceAhead(robot: Robot): number {
  const v = vectors[robot.direction]
  let cells = 0, p = { x: robot.position.x + v.x, y: robot.position.y + v.y }
  while (!blockedAt(p)) { cells++; p = { x: p.x + v.x, y: p.y + v.y } }
  return cells
}
export function validateProgram(program: readonly unknown[]): string | undefined {
  if (!Array.isArray(program) || !program.length) return 'Кемінде бір дайын пәрмен қос.'
  if (program.length > maxCommands) return 'Ең көбі ' + maxCommands + ' пәрмен.'
  if (!program.every(isCommand)) return 'Белгісіз пәрмен: тізімдегі дайын батырмаларды қолдан.'
  return undefined
}

// One robot-state transition shared by manual and programmed commands.
export function applyCommand(robot: Robot, command: Command): { robot: Robot; message: string; blocked?: boolean } {
  let next = robot, action = command, message = ''
  if (command === 'read' || command === 'ifObstacle') {
    const cells = distanceAhead(robot)
    next = { ...robot, observation: { position: { ...robot.position }, direction: robot.direction, cells } }
    message = 'Алда ' + cells + ' бос ұяшық. Бұл сантиметр емес.'
    if (command === 'read') return { robot: next, message }
    action = cells === 0 ? 'left' : 'forward'
    message += cells === 0 ? ' IF: солға 90° бұрыл.' : ' ELSE: бір ұяшық алға.'
  }
  if (action === 'forward' || action === 'backward') {
    const sign = action === 'forward' ? 1 : -1, v = vectors[next.direction]
    const p = { x: next.position.x + v.x * sign, y: next.position.y + v.y * sign }
    if (blockedAt(p)) return { robot: next, blocked: true,
      message: '(' + p.x + ',' + p.y + ') — кедергі немесе алаң шеті. Орын өзгермеді; басқа бағытты таңда немесе бағдарламаны түзет.' }
    next = { ...next, position: p, moves: next.moves + 1, ticks: next.ticks + sign * ticksPerStep,
      trail: [...next.trail, p].slice(-maxTrail) }
    if (next.object.status === 'carried') next = { ...next, object: { ...next.object, position: { ...p } } }
    return { robot: next, message: message || (sign > 0 ? 'Бір ұяшық алға: +100 шартты tick.' : 'Бір ұяшық артқа: −100 шартты tick.') }
  }
  if (action === 'left' || action === 'right') {
    const direction = directions[(directions.indexOf(next.direction) + (action === 'left' ? 3 : 1)) % 4]
    return { robot: { ...next, direction }, message: message || '90° бұрылыс: ұяшық өзгермейді. Модель бұрылысқа tick қоспайды.' }
  }
  if (action === 'open') {
    next = { ...next, claw: 'open' }
    if (robot.object.status === 'carried') {
      const delivered = samePoint(robot.position, field.zone)
      next.object = { status: delivered ? 'delivered' : 'ground', position: { ...robot.position } }
      return { robot: next, message: delivered ? '✓ Зат target area ішінде босатылды — жеткізу орындалды! Бұл баға немесе сабақтың аяқталу белгісі емес.' :
        'Зат осы ұяшықта босатылды. Ашық Claw-ды жауып, оны қайта жинауға болады.' }
    }
    return { robot: next, message: 'Claw ашылды. Затпен бір ұяшықта Close Claw орындасаң, оны жинайсың.' }
  }
  if (action === 'close') {
    if (robot.object.status === 'carried') return { robot, message: 'Claw затты ұстап тұр. Босату үшін Open Claw таңда.' }
    const pickup = robot.claw === 'open' && samePoint(robot.position, robot.object.position)
    return { robot: { ...robot, claw: 'closed', object: pickup ? { status: 'carried', position: { ...robot.position } } : robot.object },
      message: pickup ? 'Зат жиналды: енді ол роботпен бірге қозғалады.' :
        'Claw жабылды, бірақ зат алынбады. Затпен бір ұяшықта алдымен Open Claw, содан кейін Close Claw орында.' }
  }
  return { robot: next, message: 'STOP: қозғалыс пен орындау тоқтатылды.' }
}
export function manualCommand(state: SimulatorState, value: unknown): SimulatorState {
  if (state.mode !== 'teleop') return state
  if (!isCommand(value)) return { ...state, status: 'error', message: 'Белгісіз қол пәрмені. Дайын басқару элементтерін қолдан.' }
  if (value === 'stop') return stopSimulator(state)
  const result = applyCommand(state.robot, value)
  return { ...state, robot: result.robot, lastCommand: value, status: result.blocked ? 'blocked' : 'idle', message: result.message }
}
export function startAutonomous(state: SimulatorState): SimulatorState {
  if (state.mode !== 'autonomous' || (state.status !== 'idle' && state.status !== 'paused')) return state
  const error = validateProgram(state.program)
  if (error) return { ...state, status: 'error', message: error }
  return { ...state, status: 'running', message: 'Тізім ағымдағы робот күйінен орындалады. Pause — үзіліс, STOP — орындаудың соңы.' }
}
export function advanceAutonomous(state: SimulatorState): SimulatorState {
  if (state.mode !== 'autonomous' || state.status !== 'running') return state
  const error = validateProgram(state.program)
  if (error || !Number.isInteger(state.nextIndex) || state.nextIndex < 0) return { ...state, status: 'error', message: error || 'Орындау индексі жарамсыз.' }
  if (state.nextIndex >= state.program.length) return { ...state, status: 'finished', message: 'Тізім аяқталды. Бұл еркін тәжірибе: Stop міндетті бағалау шарты емес.' }
  const command = state.program[state.nextIndex], result = applyCommand(state.robot, command)
  const nextIndex = state.nextIndex + 1
  return { ...state, robot: result.robot, nextIndex, lastIndex: state.nextIndex, lastCommand: command,
    status: command === 'stop' ? 'stopped' : result.blocked ? 'blocked' : nextIndex === state.program.length ? 'finished' : 'running',
    message: result.message + (command !== 'stop' && !result.blocked && nextIndex === state.program.length ? ' Тізім аяқталды; робот жаңа пәрменді күтеді.' : '') }
}
export function pauseSimulator(state: SimulatorState): SimulatorState {
  return state.status === 'running' ? { ...state, status: 'paused', message: 'Үзіліс. Жалғастыру немесе бір қадам орындау қолжетімді.' } : state
}
export function stepAutonomous(state: SimulatorState): SimulatorState {
  const next = advanceAutonomous(startAutonomous(state))
  return next.status === 'running' ? { ...next, status: 'paused' } : next
}
export function stopSimulator(state: SimulatorState): SimulatorState {
  return { ...state, status: 'stopped', lastCommand: 'stop',
    message: 'STOP: орындау тоқтатылды. TeleOp-та жаңа пәрмен бер; Autonomous-та «Орындауды басына» арқылы тізімді қайта дайында.' }
}
export function resetExecution(state: SimulatorState): SimulatorState {
  return { ...state, status: 'idle', nextIndex: 0, lastIndex: undefined, lastCommand: undefined,
    message: 'Тізім басына қойылды. Робот пен зат орнында қалды; Run осы күйден бастайды.' }
}
export function switchMode(state: SimulatorState, mode: Mode): SimulatorState {
  if ((mode !== 'teleop' && mode !== 'autonomous') || mode === state.mode) return state
  return { ...resetExecution(state), mode, message: 'Режим ауысты: орындау тоқтады, робот/зат/із сақталды, тізім басына қойылды.' }
}
export function resetRobot(state: SimulatorState): SimulatorState {
  const object = state.robot.object.status === 'carried' ?
    { status: 'ground' as const, position: { ...state.robot.position } } :
    { ...state.robot.object, position: { ...state.robot.object.position } }
  return { ...resetExecution(state), robot: { ...initialRobot(), object },
    message: 'Робот бастапқы орынға қайтты; із/санағыштар нөлденді. Зат орнында қалды; тасылған зат бұрынғы ұяшыққа түсірілді (жеткізу деп есептелмейді). Тізім сақталды.' }
}
export function resetField(state: SimulatorState): SimulatorState {
  return { ...initialSimulator(state.mode), program: [...state.program],
    message: 'Алаң, робот, зат және санағыштар бастапқы күйде. Режим мен пәрмен тізімі сақталды.' }
}
export type Edit = { type: 'add'; command: unknown } | { type: 'delete'; index: number } |
  { type: 'move'; index: number; delta: -1 | 1 } | { type: 'clear' }
export function editProgram(state: SimulatorState, edit: Edit): SimulatorState {
  if (state.status === 'running') return state
  const program = [...state.program]
  if (edit.type === 'add') {
    if (program.length >= maxCommands || !isCommand(edit.command)) return state
    program.push(edit.command)
  } else if (edit.type === 'clear') program.length = 0
  else {
    if (!Number.isInteger(edit.index) || edit.index < 0 || edit.index >= program.length) return state
    if (edit.type === 'delete') program.splice(edit.index, 1)
    else {
      if (edit.delta !== -1 && edit.delta !== 1) return state
      const other = edit.index + edit.delta
      if (other < 0 || other >= program.length) return state
      ;[program[edit.index], program[other]] = [program[other], program[edit.index]]
    }
  }
  return { ...resetExecution(state), program, message: 'Тізім жаңарды. Орындау басынан, қазіргі робот күйінен басталады; орын мен зат өзгермеді.' }
}
export function commandForKey(key: string): Command | undefined {
  const keys: Record<string, Command> = { arrowup: 'forward', w: 'forward', arrowdown: 'backward', s: 'backward',
    arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', o: 'open', c: 'close', ' ': 'stop' }
  return Object.hasOwn(keys, key.toLowerCase()) ? keys[key.toLowerCase()] : undefined
}
export const deliveryExample: readonly Command[] = ['open', 'forward', 'forward', 'close', 'read', 'ifObstacle',
  'forward', 'forward', 'right', 'forward', 'forward', 'forward', 'left', 'forward', 'forward', 'open', 'stop']
