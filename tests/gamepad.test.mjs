import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  canCompleteGamepad, gamepadCodeScore, gamepadCodeTasks, gamepadOutput, gamepadProgressPercent,
  gamepadQuestions, gamepadQuizPassed, gamepadQuizScore, gamepadReadings, gamepadStorageKey,
  joystickFromPointer, loadGamepadProgress, normalizeGamepadProgress, normalizeJoystick, saveGamepadProgress,
} from '../src/programming/gamepadModel.ts'
import { loadProgress, saveProgress, storageKey } from '../src/programming/model.ts'
import { loadMotorProgress, saveMotorProgress, motorStorageKey } from '../src/programming/motorModel.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})
function readyProgress() {
  return normalizeGamepadProgress({ read: gamepadReadings.map(section => section.id), labDone: true,
    code: Object.fromEntries(gamepadCodeTasks.map(task => [task.id, task.answer])),
    answers: Object.fromEntries(gamepadQuestions.map(question => [question.id, question.answer])),
  })
}
test('first three lesson routes remain stable and registered hashes are unique', () => {
  assert.deepEqual(programmingLessons.slice(0, 3).map(lesson => programmingSectionFor(lesson.hash)), ['sdk-opmode', 'dc-motor', 'gamepad-teleop'])
  assert.equal(new Set(programmingLessons.map(lesson => lesson.hash)).size, programmingLessons.length)
  assert.equal(programmingSectionFor('programming/gamepad-teleop/other'), undefined)
  assert.equal(programmingSectionFor('hardware/explorer'), undefined)
})
test('joystick values clamp to [-1,1], round consistently and reject invalid numbers', () => {
  assert.equal(normalizeJoystick(9), 1)
  assert.equal(normalizeJoystick(-2), -1)
  assert.equal(normalizeJoystick(0.126), 0.13)
  for (const value of [NaN, Infinity, -Infinity, '0.5', null, undefined, {}]) assert.equal(normalizeJoystick(value), 0)
  assert.equal(Object.is(normalizeJoystick(-0.001), -0), false)
})
test('negative Y maps to positive power, positive Y to negative, and zero stays stopped', () => {
  for (let tick = -100; tick <= 100; tick++) {
    const y = tick / 100
    const result = gamepadOutput(y)
    assert.equal(result.power, y === 0 ? 0 : -y)
    assert.equal(result.rotation, y < 0 ? 'clockwise' : y > 0 ? 'counterclockwise' : 'stopped')
    assert.ok(Math.abs(result.power) <= 1)
  }
  assert.equal(Object.is(gamepadOutput(0).power, -0), false)
  assert.equal(gamepadOutput(NaN).power, 0)
})
test('pointer input handles top, center, bottom and outside the joystick bounds', () => {
  assert.equal(joystickFromPointer(132, 100, 180), -1)
  assert.equal(joystickFromPointer(190, 100, 180), 0)
  assert.equal(joystickFromPointer(248, 100, 180), 1)
  assert.equal(joystickFromPointer(-500, 100, 180), -1)
  assert.equal(joystickFromPointer(900, 100, 180), 1)
  assert.equal(joystickFromPointer(190, 100, 0), 0)
  assert.equal(joystickFromPointer(NaN, 100, 180), 0)
})
test('quiz requires all answers: four correct pass; three fail', () => {
  const progress = readyProgress()
  delete progress.answers.purpose
  assert.equal(gamepadQuizScore(progress), 4)
  assert.equal(gamepadQuizPassed(progress), false)
  progress.answers.purpose = 0
  assert.equal(gamepadQuizPassed(progress), true)
  progress.answers.mode = 2
  assert.equal(gamepadQuizScore(progress), 3)
  assert.equal(gamepadQuizPassed(progress), false)
})
test('completion requires reading, lab, code, quiz, then an explicit completion action', () => {
  const ready = readyProgress()
  assert.equal(gamepadCodeScore(ready), 5)
  assert.equal(canCompleteGamepad(ready), true)
  assert.equal(gamepadProgressPercent(ready), 88)
  assert.equal(gamepadProgressPercent({ ...ready, completed: true }), 100)
  for (const change of [{ read: [] }, { labDone: false }, { code: {} }, { answers: {} }]) {
    const progress = normalizeGamepadProgress({ ...ready, ...change, completed: true })
    assert.equal(canCompleteGamepad(progress), false)
    assert.equal(progress.completed, false)
  }
})
test('corrupt progress filters duplicates, unknown ids, invalid choices and forged completion', () => {
  assert.deepEqual(normalizeGamepadProgress({ read: ['controller', 'controller', 'bad'], code: { read: 'gamepad1.left_stick_y', power: 'bad' }, answers: { purpose: 9, mode: -1, sign: 1.5, motor: '0' }, labDone: 'true', completed: true }), { read: ['controller'], code: { read: 'gamepad1.left_stick_y' }, answers: {}, labDone: false, completed: false })
  for (const value of [null, [], 'bad', 42, { completed: true }]) assert.equal(gamepadProgressPercent(normalizeGamepadProgress(value)), 0)
})
test('lesson three persistence and retry preserve both previous lessons and Hardware data', () => {
  const values = new Map([['ftc-academy-kz:hardware:v1', '{"explored":["control-hub"]}']])
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } })
  saveProgress({ ...loadProgress(), read: ['intro'], answers: { sdk: 1 } })
  saveMotorProgress({ ...loadMotorProgress(), read: ['motor'], code: { declare: 'DcMotor' }, answers: { stop: 1 } })
  const snapshots = [values.get(storageKey), values.get(motorStorageKey), values.get('ftc-academy-kz:hardware:v1')]
  const complete = { ...readyProgress(), completed: true }
  assert.equal(saveGamepadProgress(complete), true)
  assert.deepEqual(loadGamepadProgress(), complete)
  const retry = normalizeGamepadProgress({ ...complete, answers: {}, completed: false })
  saveGamepadProgress(retry)
  assert.deepEqual(loadGamepadProgress().read, complete.read)
  assert.deepEqual(loadGamepadProgress().code, complete.code)
  assert.equal(loadGamepadProgress().labDone, true)
  assert.equal(loadGamepadProgress().completed, false)
  assert.equal(gamepadQuizPassed(loadGamepadProgress()), false)
  assert.deepEqual([values.get(storageKey), values.get(motorStorageKey), values.get('ftc-academy-kz:hardware:v1')], snapshots)
  assert.equal(new Set([storageKey, motorStorageKey, gamepadStorageKey]).size, 3)
  values.set(gamepadStorageKey, '{broken')
  assert.equal(gamepadProgressPercent(loadGamepadProgress()), 0)
})
test('blocked storage and quota exhaustion do not crash the lesson', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Blocked') } })
  assert.equal(gamepadProgressPercent(loadGamepadProgress()), 0)
  assert.equal(saveGamepadProgress(readyProgress()), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem() { throw Error('Quota') } } })
  assert.equal(saveGamepadProgress(readyProgress()), false)
})
