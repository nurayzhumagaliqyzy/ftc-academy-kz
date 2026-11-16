import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { advanceAutonomous, applyCommand, blockedAt, commandForKey, commands, deliveryExample, directions,
  distanceAhead, editProgram, field, initialRobot, initialSimulator, manualCommand, maxCommands,
  maxTrail, pauseSimulator, resetExecution, resetField, resetRobot, simulatorRoute, startAutonomous,
  stepAutonomous, stopSimulator, switchMode } from '../src/simulator/model.ts'
import { attachPlayback } from '../src/simulator/playback.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'

const manual = (s, ...cs) => cs.reduce(manualCommand, s)
function auto(program, state = initialSimulator('autonomous')) {
  let s = startAutonomous({ ...state, program: [...program] })
  for (let i = 0; i <= maxCommands && s.status === 'running'; i++) s = advanceAutonomous(s)
  return s
}
function freeze(value) {
  Object.freeze(value)
  for (const v of Object.values(value)) if (v && typeof v === 'object' && !Object.isFrozen(v)) freeze(v)
  return value
}

test('simulator route is separate from homepage cards and all eight lesson routes', () => {
  assert.equal(simulatorRoute('simulator'), true)
  for (const value of ['home', 'simulator/course', 'hardware', ...programmingLessons.map(l => l.hash)]) assert.equal(simulatorRoute(value), false)
  assert.equal(programmingSectionFor('simulator'), undefined)
  assert.equal(programmingLessons.length, 8)
  for (const lesson of programmingLessons) assert.equal(programmingSectionFor(lesson.hash), lesson.id)
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /href="#simulator">Симуляторды ашу/)
  assert.match(app, /<SimulatorModule \/>/)
  assert.doesNotMatch(app, /Жоспарда/)
})

test('all four orientations translate forward and backward, with signed illustrative ticks', () => {
  const forward = { N: { x: 2, y: 2 }, E: { x: 3, y: 3 }, S: { x: 2, y: 4 }, W: { x: 1, y: 3 } }
  const backward = { N: forward.S, E: forward.W, S: forward.N, W: forward.E }
  for (const direction of directions) {
    const r = { ...initialRobot(), position: { x: 2, y: 3 }, direction }
    for (const [c, expected, ticks] of [['forward', forward[direction], 100], ['backward', backward[direction], -100]]) {
      const result = applyCommand(r, c)
      assert.deepEqual(result.robot.position, expected)
      assert.equal(result.robot.direction, direction)
      assert.equal(result.robot.moves, 1)
      assert.equal(result.robot.ticks, ticks)
      assert.deepEqual(result.robot.trail.at(-1), expected)
    }
  }
})

test('four turns restore orientation without translating or adding ticks', () => {
  for (const command of ['left', 'right']) {
    let s = initialSimulator()
    for (let i = 0; i < 4; i++) s = manual(s, command)
    assert.equal(s.robot.direction, 'E')
    assert.deepEqual(s.robot.position, field.start)
    assert.equal(s.robot.moves, 0)
    assert.equal(s.robot.ticks, 0)
    assert.equal(s.robot.trail.length, 1)
  }
  assert.equal(manual(initialSimulator(), 'left').robot.direction, 'N')
  assert.equal(manual(initialSimulator(), 'right').robot.direction, 'S')
})

test('boundaries in every direction prevent movement and counters', () => {
  for (const [position, direction] of [[{ x: 0, y: 0 }, 'N'], [{ x: 5, y: 0 }, 'E'], [{ x: 5, y: 5 }, 'S'], [{ x: 0, y: 5 }, 'W']]) {
    const robot = { ...initialRobot(), position, direction }
    const result = applyCommand(robot, 'forward')
    assert.equal(result.blocked, true)
    assert.deepEqual(result.robot, robot)
  }
  for (const point of [{ x: -1, y: 0 }, { x: 6, y: 2 }, { x: 1.5, y: 2 }, { x: NaN, y: 0 }]) assert.equal(blockedAt(point), true)
})

test('forward and reverse obstacles block, and TeleOp can recover with another command', () => {
  let s = manual(initialSimulator(), 'forward', 'forward')
  const r = s.robot
  s = manual(s, 'forward')
  assert.equal(s.status, 'blocked')
  assert.deepEqual(s.robot, r)
  s = manual(s, 'left', 'forward')
  assert.equal(s.status, 'idle')
  assert.deepEqual(s.robot.position, { x: 2, y: 4 })
  assert.equal(applyCommand({ ...initialRobot(), position: { x: 4, y: 5 }, direction: 'E' }, 'backward').blocked, true)
})

test('front sensor reads empty cells to wall/boundary, not objects or centimeters', () => {
  assert.equal(distanceAhead(initialRobot()), 2)
  assert.equal(distanceAhead({ ...initialRobot(), position: { x: 2, y: 5 } }), 0)
  assert.equal(distanceAhead({ ...initialRobot(), position: { x: 5, y: 5 }, direction: 'N' }), 5)
  assert.equal(distanceAhead({ ...initialRobot(), direction: 'W' }), 0)
  const s = manual(initialSimulator(), 'read', 'forward')
  assert.equal(s.robot.observation.cells, 2)
  assert.deepEqual(s.robot.observation.position, field.start)
  assert.equal(distanceAhead(s.robot), 1)
})

test('IF-OBSTACLE samples current state and chooses exactly left or forward', () => {
  const free = manual(initialSimulator(), 'ifObstacle')
  assert.deepEqual(free.robot.position, { x: 1, y: 5 })
  assert.equal(free.robot.direction, 'E')
  let s = manual(initialSimulator(), 'read', 'forward', 'forward', 'ifObstacle')
  assert.deepEqual(s.robot.position, { x: 2, y: 5 })
  assert.equal(s.robot.direction, 'N')
  assert.equal(s.robot.observation.cells, 0)
  assert.equal(s.robot.moves, 2)
})

test('pickup needs the same cell and an open-to-closed transition', () => {
  let s = manual(initialSimulator(), 'open', 'close')
  assert.equal(s.robot.object.status, 'ground')
  s = manual(s, 'forward', 'forward', 'close')
  assert.equal(s.robot.object.status, 'ground')
  s = manual(s, 'open', 'close')
  assert.equal(s.robot.object.status, 'carried')
  assert.equal(s.robot.claw, 'closed')
  assert.equal(manual(s, 'close').robot.object.status, 'carried')
})

test('carried object follows forward and backward; outside release stays on field', () => {
  let s = manual(initialSimulator(), 'open', 'forward', 'forward', 'close', 'backward')
  assert.deepEqual(s.robot.object.position, s.robot.position)
  assert.deepEqual(s.robot.position, { x: 1, y: 5 })
  s = manual(s, 'open')
  assert.equal(s.robot.object.status, 'ground')
  assert.deepEqual(s.robot.object.position, { x: 1, y: 5 })
  assert.equal(manual(s, 'close').robot.object.status, 'carried')
})

test('reference delivery works identically manually and autonomously', () => {
  const a = auto(deliveryExample)
  const m = manual(initialSimulator(), ...deliveryExample)
  assert.deepEqual(a.robot, m.robot)
  assert.equal(a.robot.object.status, 'delivered')
  assert.deepEqual(a.robot.object.position, field.zone)
  assert.deepEqual(a.robot.position, field.zone)
  assert.equal(a.robot.claw, 'open')
  assert.equal(a.robot.moves, 9)
  assert.equal(a.robot.ticks, 900)
  assert.equal(a.status, 'stopped')
})

test('zone coordinates or Stop alone never fabricate delivery; delivered object can be collected again', () => {
  const withoutRelease = auto(deliveryExample.filter(c => c !== 'open').slice(0, -1))
  assert.notEqual(withoutRelease.robot.object.status, 'delivered')
  const carried = auto(deliveryExample.slice(0, -2))
  assert.deepEqual(carried.robot.position, field.zone)
  assert.equal(carried.robot.object.status, 'carried')
  assert.equal(stopSimulator(carried).robot.object.status, 'carried')
  let s = auto(deliveryExample)
  s = switchMode(s, 'teleop')
  s = manual(s, 'close')
  assert.equal(s.robot.object.status, 'carried')
})

test('no Stop is required in free practice; Stop ignores its tail', () => {
  const done = auto(['forward'])
  assert.equal(done.status, 'finished')
  assert.equal(done.robot.moves, 1)
  const stopped = auto(['stop', 'forward'])
  assert.equal(stopped.status, 'stopped')
  assert.equal(stopped.robot.moves, 0)
  assert.equal(stopped.nextIndex, 1)
  assert.deepEqual(advanceAutonomous(stopped), stopped)
})

test('pause, resume, step and emergency Stop have deterministic transitions', () => {
  let s = { ...initialSimulator('autonomous'), program: ['forward', 'left', 'forward'] }
  s = advanceAutonomous(startAutonomous(s))
  s = pauseSimulator(s)
  const paused = s
  assert.equal(paused.status, 'paused')
  assert.equal(advanceAutonomous(paused), paused)
  s = stepAutonomous(s)
  assert.equal(s.robot.direction, 'N')
  assert.equal(s.nextIndex, 2)
  s = advanceAutonomous(startAutonomous(s))
  assert.equal(s.status, 'finished')
  assert.deepEqual(s.robot.position, { x: 1, y: 4 })
  const stopped = stopSimulator(startAutonomous({ ...resetExecution(s), program: ['forward'] }))
  assert.equal(advanceAutonomous(stopped), stopped)
  assert.equal(startAutonomous(stopped), stopped)
})

test('automatic collision stops the queue without advancing physical state', () => {
  const s = auto(['forward', 'forward', 'forward', 'left'])
  assert.equal(s.status, 'blocked')
  assert.equal(s.lastCommand, 'forward')
  assert.equal(s.nextIndex, 3)
  assert.equal(s.robot.direction, 'E')
  assert.equal(s.robot.moves, 2)
  assert.deepEqual(advanceAutonomous(s), s)
})

test('mode changes cancel the queue and preserve pose/object/draft without manual input leaking into Auto', () => {
  let s = { ...initialSimulator('autonomous'), program: ['forward', 'left'] }
  s = advanceAutonomous(startAutonomous(s))
  const pose = s.robot
  const tele = switchMode(s, 'teleop')
  assert.equal(tele.status, 'idle')
  assert.equal(tele.nextIndex, 0)
  assert.deepEqual(tele.robot, pose)
  assert.deepEqual(advanceAutonomous(tele), tele)
  const back = switchMode(tele, 'autonomous')
  assert.deepEqual(manual(back, 'forward'), back)
  assert.deepEqual(back.program, s.program)
})

test('editing resets execution but preserves physical state and is blocked during Run', () => {
  let s = editProgram(initialSimulator('autonomous'), { type: 'add', command: 'forward' })
  s = editProgram(s, { type: 'add', command: 'left' })
  assert.deepEqual(editProgram(s, { type: 'move', index: 1, delta: -1 }).program, ['left', 'forward'])
  const running = startAutonomous(s)
  assert.equal(editProgram(running, { type: 'clear' }), running)
  s = pauseSimulator(advanceAutonomous(running))
  const edited = editProgram(s, { type: 'delete', index: 1 })
  assert.equal(edited.nextIndex, 0)
  assert.equal(edited.status, 'idle')
  assert.deepEqual(edited.robot, s.robot)
  assert.deepEqual(editProgram(edited, { type: 'clear' }).program, [])
})

test('unknown commands, prototype names, indices and excessive programs are rejected', () => {
  for (const value of ['__proto__', 'toString', 'move-fast', null, NaN, {}]) {
    assert.equal(manual(initialSimulator(), value).status, 'error')
    assert.equal(startAutonomous({ ...initialSimulator('autonomous'), program: [value] }).status, 'error')
    assert.deepEqual(editProgram(initialSimulator(), { type: 'add', command: value }), initialSimulator())
  }
  let s = initialSimulator('autonomous')
  for (let i = 0; i < maxCommands + 3; i++) s = editProgram(s, { type: 'add', command: 'left' })
  assert.equal(s.program.length, maxCommands)
  assert.equal(auto(Array(maxCommands + 1).fill('left')).status, 'error')
  assert.equal(auto([]).status, 'error')
  for (const index of [-1, 0.5, NaN, maxCommands]) assert.equal(editProgram(s, { type: 'delete', index }), s)
  assert.equal(editProgram(s, { type: 'move', index: 0, delta: -1 }), s)
  assert.equal(editProgram(s, { type: 'move', index: 0, delta: 9 }), s)
  assert.equal(advanceAutonomous({ ...s, status: 'running', nextIndex: NaN }).status, 'error')
})

test('reset execution, reset robot, reset field and reopen have distinct documented behavior', () => {
  const s = manual(initialSimulator(), 'open', 'forward', 'forward', 'close', 'backward')
  const draft = { ...s, program: ['forward'] }
  assert.deepEqual(resetExecution(draft).robot, draft.robot)
  const reset = resetRobot(draft)
  assert.deepEqual(reset.robot.position, field.start)
  assert.deepEqual(reset.robot.object.position, { x: 1, y: 5 })
  assert.equal(reset.robot.object.status, 'ground')
  assert.equal(reset.robot.ticks, 0)
  assert.equal(reset.robot.moves, 0)
  assert.deepEqual(reset.program, draft.program)
  assert.deepEqual(resetField(draft).robot, initialRobot())
  assert.deepEqual(resetField(draft).program, draft.program)
  assert.deepEqual(initialSimulator().program, [])
})

test('zero net ticks after a forward/reverse pair still counts two movements; history is bounded', () => {
  let s = initialSimulator()
  for (let i = 0; i < maxTrail; i++) s = manual(s, 'forward', 'backward')
  assert.equal(s.robot.ticks, 0)
  assert.equal(s.robot.moves, maxTrail * 2)
  assert.equal(s.robot.trail.length, maxTrail)
})

test('state transitions do not mutate their input or the initial field', () => {
  const s = freeze(initialSimulator())
  const old = JSON.stringify(s)
  manual(s, 'read', 'forward', 'left', 'open', 'close')
  resetRobot(s); resetField(s); switchMode(s, 'autonomous'); editProgram(s, { type: 'add', command: 'stop' })
  assert.equal(JSON.stringify(s), old)
  assert.deepEqual(field.object, { x: 2, y: 5 })
})

test('keyboard vocabulary is bounded; no simulator source accesses lesson persistence', () => {
  for (const [key, c] of [['W','forward'],['ArrowUp','forward'],['s','backward'],['a','left'],['ArrowRight','right'],['o','open'],['c','close'],[' ','stop']]) assert.equal(commandForKey(key), c)
  for (const key of ['Enter','Tab','Escape','__proto__']) assert.equal(commandForKey(key), undefined)
  for (const path of ['model.ts','playback.ts','SimulatorModule.tsx','ProgramEditor.tsx','RobotField.tsx']) {
    const source = readFileSync(new URL('../src/simulator/' + path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /(?:localStorage|sessionStorage)\s*[.[]|saveProgress\s*\(|onSuccess\s*[:=(]/)
  }
  assert.equal(Object.keys(commands).length, 9)
})

function playbackHost() {
  let callback, cleared = 0
  const events = new Map(), documentEvents = new Map()
  const add = (map, name, cb) => map.set(name, cb)
  const remove = (map, name, cb) => { if (map.get(name) === cb) map.delete(name) }
  const host = { setInterval(fn) { callback = fn; return 1 }, clearInterval(id) { assert.equal(id, 1); cleared++ },
    document: { hidden: false, addEventListener: (n,c) => add(documentEvents,n,c), removeEventListener: (n,c) => remove(documentEvents,n,c) },
    addEventListener: (n,c) => add(events,n,c), removeEventListener: (n,c) => remove(events,n,c) }
  return { host, tick: () => callback(), events, documentEvents, cleared: () => cleared }
}
test('playback cleanup removes timer/listeners and ignores an already queued callback', () => {
  const fake = playbackHost()
  let ticks = 0
  const dispose = attachPlayback(fake.host, () => ticks++, () => {})
  fake.tick(); assert.equal(ticks, 1)
  dispose(); fake.tick()
  assert.equal(ticks, 1)
  assert.equal(fake.cleared(), 1)
  assert.equal(fake.events.size + fake.documentEvents.size, 0)
})
test('hidden/blur playback pauses and Stop/mode changes guard queued advancement', () => {
  const fake = playbackHost()
  let s = startAutonomous({ ...initialSimulator('autonomous'), program: ['forward','left'] })
  const dispose = attachPlayback(fake.host, () => { s = advanceAutonomous(s) }, () => { s = pauseSimulator(s) })
  fake.host.document.hidden = true
  fake.documentEvents.get('visibilitychange')()
  fake.tick()
  assert.equal(s.status, 'paused')
  assert.equal(s.robot.moves, 0)
  fake.host.document.hidden = false
  s = startAutonomous(s); fake.events.get('blur')()
  assert.equal(s.status, 'paused')
  s = stopSimulator(s); fake.tick(); assert.equal(s.robot.moves, 0)
  s = switchMode(s, 'teleop'); fake.tick(); assert.equal(s.robot.moves, 0)
  dispose()
})
