import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  advanceExecution, atTarget, autonomousCodeScore, autonomousCodeTasks, autonomousProgressPercent,
  autonomousQuestions, autonomousQuizPassed, autonomousQuizScore, autonomousReadings, autonomousStorageKey,
  canCompleteAutonomous, challenges, gridSize, initialExecution, loadAutonomousProgress,
  normalizeAutonomousProgress, saveAutonomousProgress,
} from '../src/programming/autonomousModel.ts'
import { loadProgress, saveProgress, storageKey } from '../src/programming/model.ts'
import { loadMotorProgress, saveMotorProgress, motorStorageKey } from '../src/programming/motorModel.ts'
import { loadGamepadProgress, saveGamepadProgress, gamepadStorageKey } from '../src/programming/gamepadModel.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})
const solutions = [
  ['forward', 'forward', 'stop'],
  ['forward', 'forward', 'right', 'forward', 'forward', 'stop'],
  ['forward', 'right', 'forward', 'forward', 'forward', 'left', 'forward', 'forward', 'stop'],
]
function run(challenge, commands) {
  let state = { ...initialExecution(challenge), status: 'running' }
  for (let i = 0; i <= commands.length && state.status === 'running'; i++) state = advanceExecution(state, commands, challenge)
  return state
}
function readyProgress() {
  return normalizeAutonomousProgress({ read: autonomousReadings.map(section => section.id), solved: challenges.map(challenge => challenge.id),
    code: Object.fromEntries(autonomousCodeTasks.map(task => [task.id, task.answer])),
    answers: Object.fromEntries(autonomousQuestions.map(question => [question.id, question.answer])),
  })
}
test('all four implemented lesson routes are unique; unimplemented lessons do not resolve', () => {
  assert.deepEqual(programmingLessons.map(lesson => programmingSectionFor(lesson.hash)), ['sdk-opmode', 'dc-motor', 'gamepad-teleop', 'autonomous'])
  assert.equal(new Set(programmingLessons.map(lesson => lesson.hash)).size, 4)
  for (const hash of ['programming/autonomous/other', 'programming/5', 'hardware/explorer']) assert.equal(programmingSectionFor(hash), undefined)
})
test('all three challenges are deterministic and solvable with increasing sequence length', () => {
  challenges.forEach((challenge, index) => {
    const result = run(challenge, solutions[index])
    assert.equal(result.status, 'success')
    assert.equal(atTarget(result.pose, challenge), true)
    assert.equal(result.nextIndex, solutions[index].length)
    assert.deepEqual(result, run(challenge, solutions[index]))
    assert.ok(result.path.every(point => point.x >= 0 && point.x < gridSize && point.y >= 0 && point.y < gridSize))
    assert.ok(result.path.every(point => !challenge.walls.some(wall => wall.x === point.x && wall.y === point.y)))
    if (index) assert.ok(solutions[index].length > solutions[index - 1].length)
  })
})
test('forward moves exactly one cell in each orientation; turns change orientation only', () => {
  const deltas = [[0, 1], [1, 0], [0, -1], [-1, 0]]
  for (let direction = 0; direction < 4; direction++) {
    const challenge = { ...challenges[0], start: { x: 3, y: 3, direction } }
    const initial = { ...initialExecution(challenge), status: 'running' }
    const forward = advanceExecution(initial, ['forward'], challenge)
    assert.deepEqual(forward.pose, { x: 3 + deltas[direction][0], y: 3 + deltas[direction][1], direction })
    for (const command of ['left', 'right']) {
      const turned = advanceExecution(initial, [command], challenge)
      assert.equal(turned.pose.x, 3); assert.equal(turned.pose.y, 3)
      assert.equal(turned.pose.direction, (direction + (command === 'left' ? 3 : 1)) % 4)
      assert.deepEqual(turned.path, initial.path)
      assert.equal(turned.angle, direction * 90 + (command === 'left' ? -90 : 90))
    }
  }
})
test('four outward boundary moves and obstacle collisions are rejected without changing position or path', () => {
  for (const start of [{ x: 3, y: 5, direction: 0 }, { x: 5, y: 3, direction: 1 }, { x: 3, y: 0, direction: 2 }, { x: 0, y: 3, direction: 3 }]) {
    const challenge = { ...challenges[0], start }
    const initial = { ...initialExecution(challenge), status: 'running' }
    const blocked = advanceExecution(initial, ['forward'], challenge)
    assert.equal(blocked.status, 'blocked')
    assert.deepEqual(blocked.pose, start)
    assert.deepEqual(blocked.path, initial.path)
    assert.equal(blocked.nextIndex, 1)
  }
  const blocked = run(challenges[2], ['forward', 'forward', 'stop'])
  assert.equal(blocked.status, 'blocked')
  assert.deepEqual(blocked.pose, { x: 3, y: 1, direction: 3 })
  assert.equal(blocked.path.length, 2)
})
test('Stop terminates execution and success requires stopping on the target, not passing through it', () => {
  assert.equal(run(challenges[0], ['stop', 'forward', 'forward']).status, 'stopped')
  assert.equal(run(challenges[0], ['forward', 'forward']).status, 'finished')
  assert.equal(run(challenges[0], ['forward', 'forward', 'forward', 'stop']).status, 'stopped')
  const success = run(challenges[0], ['forward', 'forward', 'stop', 'forward'])
  assert.equal(success.status, 'success')
  assert.equal(success.nextIndex, 3)
  assert.equal(success.pose.y, 3)
})
test('pause is inert, resume preserves the cursor/path, and reset returns to the start without stale steps', () => {
  const challenge = challenges[0]
  const commands = solutions[0]
  const initial = { ...initialExecution(challenge), status: 'running' }
  const afterOne = advanceExecution(initial, commands, challenge)
  const paused = { ...afterOne, status: 'paused' }
  assert.strictEqual(advanceExecution(paused, commands, challenge), paused)
  const resumed = advanceExecution({ ...paused, status: 'running' }, commands, challenge)
  assert.equal(resumed.pose.y, 3)
  assert.equal(resumed.nextIndex, 2)
  assert.equal(resumed.path.length, 3)
  const reset = initialExecution(challenge)
  assert.equal(reset.status, 'ready')
  assert.equal(reset.nextIndex, 0)
  assert.deepEqual(reset.pose, challenge.start)
  assert.equal(reset.path.length, 1)
  assert.strictEqual(advanceExecution(reset, commands, challenge), reset)
  assert.equal(afterOne.pose.y, 2)
})
test('empty and unknown command lists stop without creating movement', () => {
  const empty = run(challenges[0], [])
  assert.equal(empty.status, 'finished')
  assert.deepEqual(empty.pose, challenges[0].start)
  const bad = run(challenges[0], ['fly'])
  assert.equal(bad.status, 'blocked')
  assert.deepEqual(bad.pose, challenges[0].start)
})
test('quiz requires all five answers and at least four correct', () => {
  const progress = readyProgress()
  delete progress.answers.mode
  assert.equal(autonomousQuizScore(progress), 4)
  assert.equal(autonomousQuizPassed(progress), false)
  progress.answers.mode = 1
  assert.equal(autonomousQuizPassed(progress), true)
  progress.answers.start = 0
  assert.equal(autonomousQuizScore(progress), 3)
  assert.equal(autonomousQuizPassed(progress), false)
})
test('completion needs four readings, three challenges, six code answers, quiz and an explicit action', () => {
  const ready = readyProgress()
  assert.equal(autonomousCodeScore(ready), 6)
  assert.equal(canCompleteAutonomous(ready), true)
  assert.equal(autonomousProgressPercent(ready), 90)
  assert.equal(autonomousProgressPercent({ ...ready, completed: true }), 100)
  for (const change of [{ read: [] }, { solved: ['straight', 'corner'] }, { code: {} }, { answers: {} }]) {
    const progress = normalizeAutonomousProgress({ ...ready, ...change, completed: true })
    assert.equal(progress.completed, false)
    assert.equal(canCompleteAutonomous(progress), false)
  }
})
test('invalid storage values and forged completion are normalized without duplicate milestones', () => {
  assert.deepEqual(normalizeAutonomousProgress({ read: ['mode', 'mode', 'bad'], solved: ['corner', 'corner', 'bad'], code: { annotation: 'Autonomous', stop: 'bad' }, answers: { mode: 4, start: '1', stop: 0.5, time: 2 }, completed: true }), { read: ['mode'], solved: ['corner'], code: { annotation: 'Autonomous' }, answers: { time: 2 }, completed: false })
  for (const value of [null, [], 'bad', 42, { completed: true }]) assert.equal(autonomousProgressPercent(normalizeAutonomousProgress(value)), 0)
})
test('lesson four round-trip and quiz retry leave all earlier lesson and Hardware data untouched', () => {
  const values = new Map([['ftc-academy-kz:hardware:v1', '{"explored":["control-hub"]}']])
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } })
  saveProgress({ ...loadProgress(), read: ['intro'], answers: { sdk: 1 } })
  saveMotorProgress({ ...loadMotorProgress(), read: ['motor'], answers: { stop: 1 } })
  saveGamepadProgress({ ...loadGamepadProgress(), read: ['controller'], code: { stop: '0' }, answers: { axis: 2 } })
  const snapshots = new Map(values)
  const complete = { ...readyProgress(), completed: true }
  assert.equal(saveAutonomousProgress(complete), true)
  assert.deepEqual(loadAutonomousProgress(), complete)
  const retry = normalizeAutonomousProgress({ ...complete, answers: {}, completed: false })
  saveAutonomousProgress(retry)
  assert.deepEqual(loadAutonomousProgress().read, complete.read)
  assert.deepEqual(loadAutonomousProgress().solved, complete.solved)
  assert.deepEqual(loadAutonomousProgress().code, complete.code)
  assert.equal(loadAutonomousProgress().completed, false)
  assert.equal(autonomousQuizPassed(loadAutonomousProgress()), false)
  for (const [key, value] of snapshots) assert.equal(values.get(key), value)
  assert.equal(new Set([storageKey, motorStorageKey, gamepadStorageKey, autonomousStorageKey]).size, 4)
  values.set(autonomousStorageKey, '{broken')
  assert.equal(autonomousProgressPercent(loadAutonomousProgress()), 0)
})
test('blocked localStorage and quota errors preserve a usable in-memory lesson', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Blocked') } })
  assert.equal(autonomousProgressPercent(loadAutonomousProgress()), 0)
  assert.equal(saveAutonomousProgress(readyProgress()), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem() { throw Error('Quota') } } })
  assert.equal(saveAutonomousProgress(readyProgress()), false)
})
