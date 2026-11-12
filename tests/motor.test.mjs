import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  motorScenario, motorChecks, canCompleteMotor, codeTasks, loadMotorProgress, motorCodeScore, motorOutput, motorProgressPercent,
  motorQuestions, motorQuizPassed, motorQuizScore, motorReadings, motorStorageKey,
  normalizeMotorProgress, normalizePower, saveMotorProgress,
} from '../src/programming/motorModel.ts'
import { loadProgress, saveProgress, storageKey } from '../src/programming/model.ts'
import { programmingSectionFor } from '../src/programming/routes.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})
function readyProgress() {
  return normalizeMotorProgress({ assessmentVersion: 2, scenarioAnswer: motorScenario.answer,
    read: motorReadings.map(section => section.id), labDone: true, labChecks: motorChecks.map(check => check.id),
    code: Object.fromEntries(codeTasks.map(task => [task.id, task.answer])),
    answers: Object.fromEntries(motorQuestions.map(question => [question.id, question.answer])),
  })
}

test('existing first-lesson URL, lesson list, and second lesson resolve without claiming hardware anchors', () => {
  assert.equal(programmingSectionFor('programming/sdk-opmode'), 'sdk-opmode')
  assert.equal(programmingSectionFor('programming/dc-motor'), 'dc-motor')
  assert.equal(programmingSectionFor('programming/lessons'), 'lessons')
  for (const hash of ['home', 'hardware/explorer', 'hardware/quiz', 'programming', 'programming/dc-motor/other']) {
    assert.equal(programmingSectionFor(hash), undefined)
  }
})

test('power clamps, rejects non-finite values and strings, and rounds to slider steps', () => {
  assert.equal(normalizePower(3), 1)
  assert.equal(normalizePower(-8), -1)
  assert.equal(normalizePower(0.52), 0.5)
  assert.equal(normalizePower(-0.52), -0.5)
  for (const value of [NaN, Infinity, -Infinity, '0.5', null, undefined, {}]) assert.equal(normalizePower(value), 0)
  assert.equal(Object.is(normalizePower(-0.001), -0), false)
})

test('power sign and configured direction jointly determine conceptual rotation', () => {
  assert.equal(motorOutput(0.5, 'FORWARD', true).rotation, 'clockwise')
  assert.equal(motorOutput(-0.5, 'FORWARD', true).rotation, 'counterclockwise')
  assert.equal(motorOutput(0.5, 'REVERSE', true).rotation, 'counterclockwise')
  assert.equal(motorOutput(-0.5, 'REVERSE', true).rotation, 'clockwise')
  for (const direction of ['FORWARD', 'REVERSE']) {
    assert.equal(motorOutput(0, direction, true).rotation, 'stopped')
    const stopped = motorOutput(1, direction, false)
    assert.equal(stopped.rotation, 'stopped')
    assert.equal(stopped.appliedPower, 0)
    assert.ok(stopped.command.includes('motor.setPower(0.00);'))
  }
  assert.ok(motorOutput(0.5, 'REVERSE', true).command.includes('DcMotorSimple.Direction.REVERSE'))
  assert.ok(motorOutput(0.5, 'REVERSE', true).command.includes('motor.setPower(0.50);'))
})

test('all answers are required to pass; four correct answers pass and three fail', () => {
  const progress = readyProgress()
  delete progress.answers.purpose
  assert.equal(motorQuizScore(progress), 4)
  assert.equal(motorQuizPassed(progress), false)
  progress.answers.purpose = 1
  assert.equal(motorQuizPassed(progress), true)
  progress.answers.class = 1
  assert.equal(motorQuizScore(progress), 3)
  assert.equal(motorQuizPassed(progress), false)
})

test('reading, lab, code and quiz are necessary; explicit completion reaches 100%', () => {
  const progress = readyProgress()
  assert.equal(motorCodeScore(progress), 5)
  assert.equal(canCompleteMotor(progress), true)
  assert.equal(motorProgressPercent(progress), 89)
  assert.equal(motorProgressPercent({ ...progress, completed: true }), 100)
  for (const change of [{ read: [] }, { labChecks: [] }, { code: {} }, { answers: {} }]) {
    const incomplete = normalizeMotorProgress({ ...progress, ...change, completed: true })
    assert.equal(canCompleteMotor(incomplete), false)
    assert.equal(incomplete.completed, false)
  }
})

test('invalid saved values, duplicate reading ids and forged completion are normalized', () => {
  for (const value of [null, [], 'bad', 2, { completed: true }]) assert.equal(motorProgressPercent(normalizeMotorProgress(value)), 0)
  assert.deepEqual(normalizeMotorProgress({
    read: ['motor', 'motor', 'unknown'], code: { declare: 'DcMotor', map: 'bad', unknown: '0' },
    answers: { purpose: 5, class: -1, range: 0.5, direction: '2', stop: 1 }, labDone: 'true', completed: true,
  }), { assessmentVersion: 2, previouslyCompleted: false, labChecks: [], read: ['motor'], code: { declare: 'DcMotor' }, answers: { stop: 1 }, labDone: false, completed: false })
})

test('second-lesson round trip does not modify first-lesson or Hardware storage', () => {
  const values = new Map([['ftc-academy-kz:hardware:v1', '{"explored":["control-hub"]}']])
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
  } })
  const first = { ...loadProgress(), read: ['intro'], answers: { sdk: 1 } }
  assert.equal(saveProgress(first), true)
  const firstSnapshot = values.get(storageKey)
  const motor = { ...readyProgress(), completed: true }
  motor.answers.purpose = 1
  assert.equal(saveMotorProgress(motor), true)
  assert.deepEqual(loadMotorProgress(), motor)
  assert.equal(values.get(storageKey), firstSnapshot)
  assert.deepEqual(loadProgress(), first)
  assert.equal(values.get('ftc-academy-kz:hardware:v1'), '{"explored":["control-hub"]}')
  assert.notEqual(storageKey, motorStorageKey)
  assert.equal(saveProgress({ ...first, read: ['intro', 'sdk'] }), true)
  assert.deepEqual(loadMotorProgress(), motor)
  values.set(motorStorageKey, '{broken')
  assert.equal(motorProgressPercent(loadMotorProgress()), 0)
})

test('blocked storage and quota failures fall back without crashing', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Blocked') } })
  assert.equal(motorProgressPercent(loadMotorProgress()), 0)
  assert.equal(saveMotorProgress(readyProgress()), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem() { return null }, setItem() { throw new Error('Quota exceeded') },
  } })
  assert.equal(saveMotorProgress(readyProgress()), false)
})

test('quiz retry retains reading, lab and code while removing quiz and completion', () => {
  const before = { ...readyProgress(), completed: true }
  const after = normalizeMotorProgress({ ...before, answers: {}, completed: false })
  assert.deepEqual(after.read, before.read)
  assert.deepEqual(after.code, before.code)
  assert.equal(after.labDone, true)
  assert.equal(after.completed, false)
  assert.equal(motorQuizPassed(after), false)
})
