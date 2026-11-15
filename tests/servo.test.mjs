import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  servoStorageKey, servoReadings, servoChallenges, servoCodeTasks, servoQuestions, servoScenario,
  normalizeServoPosition, servoClawOutput, evaluateServoChallenge, normalizeServoProgress,
  canCompleteServo, servoProgressPercent, servoQuizScore, servoQuizPassed, servoCodeScore,
  loadServoProgress, saveServoProgress,
} from '../src/programming/servoModel.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'
import { storageKey, legacyStorageKey } from '../src/programming/model.ts'
import { motorStorageKey, legacyMotorStorageKey } from '../src/programming/motorModel.ts'
import { gamepadStorageKey, legacyGamepadStorageKey } from '../src/programming/gamepadModel.ts'
import { autonomousStorageKey, legacyAutonomousStorageKey } from '../src/programming/autonomousModel.ts'

const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
  else delete globalThis.localStorage
})
function ready() {
  return normalizeServoProgress({ read: servoReadings.map(item => item.id), solved: servoChallenges.map(item => item.id),
    code: Object.fromEntries(servoCodeTasks.map(item => [item.id, item.answer])),
    answers: Object.fromEntries(servoQuestions.map(item => [item.id, item.answer])), scenarioAnswer: servoScenario.answer })
}
function storage(values) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
  } })
}
test('first five routes stay stable; future routes remain absent', () => {
  assert.deepEqual(programmingLessons.slice(0, 5).map(item => programmingSectionFor(item.hash)), ['sdk-opmode', 'dc-motor', 'gamepad-teleop', 'autonomous', 'servo'])
  assert.equal(new Set(programmingLessons.map(item => item.hash)).size, programmingLessons.length)
  for (const route of ['sensor', 'integrated-challenge', 'servo/other']) assert.equal(programmingSectionFor('programming/' + route), undefined)
})
test('position clamps to 0..1, rounds to hundredths and handles invalid inputs safely', () => {
  for (const [input, expected] of [[-10, 0], [0, 0], [0.254, .25], [.256, .26], [1, 1], [10, 1]]) assert.equal(normalizeServoPosition(input), expected)
  for (const input of [NaN, Infinity, -Infinity, null, undefined, '.7', {}]) assert.equal(normalizeServoPosition(input), .5)
  assert.equal(Object.is(normalizeServoPosition(-0), -0), false)
})
test('claw illustration and Java command consistently follow every slider step', () => {
  for (let index = 0; index <= 100; index++) {
    const position = index / 100
    const result = servoClawOutput(position)
    assert.equal(result.position, position)
    assert.equal(result.command, `claw.setPosition(${position.toFixed(2)});`)
    assert.ok(result.jawSpread >= 8 && result.jawSpread <= 60)
    if (index) assert.ok(result.jawSpread > servoClawOutput((index - 1) / 100).jawSpread)
  }
})
test('all three challenges require BOTH the requested position and its correct interpretation', () => {
  for (const challenge of servoChallenges) {
    assert.equal(evaluateServoChallenge(challenge.id, challenge.target, challenge.answer).correct, true)
    for (let answer = 0; answer < challenge.options.length; answer++) {
      if (answer !== challenge.answer) assert.equal(evaluateServoChallenge(challenge.id, challenge.target, answer).correct, false)
    }
    for (const position of [0, .5, 1, challenge.target + .01, -1, 2, NaN, '0.25']) assert.equal(evaluateServoChallenge(challenge.id, position, challenge.answer).correct, false)
    assert.equal(evaluateServoChallenge(challenge.id, challenge.target, undefined).correct, false)
  }
  assert.equal(evaluateServoChallenge('unknown', .25, 1).correct, false)
  assert.equal(servoChallenges[2].target, Math.round((.75 - .35) * 100) / 100)
})
test('quiz needs all five attempts and >=4 correct; code needs five correct answers', () => {
  const progress = ready()
  assert.equal(servoQuizScore(progress), 5); assert.equal(servoCodeScore(progress), 5)
  delete progress.answers.type
  assert.equal(servoQuizScore(progress), 4); assert.equal(servoQuizPassed(progress), false)
  progress.answers.type = 0
  assert.equal(servoQuizPassed(progress), true)
  progress.answers.range = 0
  assert.equal(servoQuizScore(progress), 3); assert.equal(servoQuizPassed(progress), false)
  progress.code.position = 'setPower'
  assert.equal(servoCodeScore(progress), 4)
})
test('completion gates every reading, each Lab, all code, passed quiz and correct scenario; completion is explicit', () => {
  const progress = ready()
  assert.equal(canCompleteServo(progress), true)
  assert.equal(progress.completed, false)
  assert.equal(servoProgressPercent(progress), 91)
  assert.equal(servoProgressPercent(normalizeServoProgress({ ...progress, completed: true })), 100)
  const omissions = [
    ...servoReadings.map(item => ({ read: progress.read.filter(id => id !== item.id) })),
    ...servoChallenges.map(item => ({ solved: progress.solved.filter(id => id !== item.id) })),
    ...servoCodeTasks.map(item => ({ code: { ...progress.code, [item.id]: undefined } })),
    { answers: {} }, { scenarioAnswer: undefined }, { scenarioAnswer: 0 },
  ]
  for (const omission of omissions) {
    const result = normalizeServoProgress({ ...progress, completed: true, ...omission })
    assert.equal(canCompleteServo(result), false)
    assert.equal(result.completed, false)
    assert.ok(servoProgressPercent(result) < 100)
  }
})
test('normalization filters duplicates, invalid ids, invalid choices and forged completion', () => {
  const result = normalizeServoProgress({ read: ['sdk', 'sdk', 'bad'], solved: ['target', 'target', 'bad'], code: { type: 'CRServo', map: 'invalid' }, answers: { type: 9, range: .5, feedback: '0', travel: 1 }, scenarioAnswer: 99, completed: true })
  assert.deepEqual(result, { assessmentVersion: 1, previouslyCompleted: false, read: ['sdk'], solved: ['target'], code: { type: 'CRServo' }, answers: { travel: 1 }, completed: false })
  for (const input of [null, [], 4, 'broken', { completed: true }]) assert.equal(servoProgressPercent(normalizeServoProgress(input)), 0)
})
test('Servo round-trip and retries leave all four lessons, v1 backups and Hardware untouched', () => {
  const oldKeys = [storageKey, legacyStorageKey, motorStorageKey, legacyMotorStorageKey, gamepadStorageKey, legacyGamepadStorageKey, autonomousStorageKey, legacyAutonomousStorageKey, 'ftc-academy-kz:hardware:v1']
  const values = new Map(oldKeys.map(key => [key, `snapshot:${key}`]))
  const before = new Map(values)
  storage(values)
  assert.equal(saveServoProgress({ ...ready(), completed: true }), true)
  assert.equal(loadServoProgress().completed, true)
  const progress = loadServoProgress()
  for (const change of [{ answers: {} }, { solved: [] }, { scenarioAnswer: undefined }]) {
    saveServoProgress({ ...progress, ...change, completed: false })
    const result = loadServoProgress()
    assert.deepEqual(result.read, progress.read)
    assert.deepEqual(result.code, progress.code)
    if (!('answers' in change)) assert.deepEqual(result.answers, progress.answers)
    if (!('solved' in change)) assert.deepEqual(result.solved, progress.solved)
    if (!('scenarioAnswer' in change)) assert.equal(result.scenarioAnswer, progress.scenarioAnswer)
    assert.equal(result.completed, false)
  }
  for (const [key, value] of before) assert.equal(values.get(key), value)
  assert.equal(values.size, before.size + 1)
  assert.equal(new Set([...oldKeys, servoStorageKey]).size, oldKeys.length + 1)
})
test('partial Lab evidence survives reload and repeated awards count once', () => {
  const values = new Map(); storage(values)
  for (const challenge of servoChallenges) {
    const progress = loadServoProgress()
    saveServoProgress({ ...progress, solved: [...progress.solved, challenge.id, challenge.id] })
    assert.equal(loadServoProgress().solved.length, servoChallenges.indexOf(challenge) + 1)
  }
  const restored = loadServoProgress()
  assert.equal(servoProgressPercent(restored), 27)
  assert.equal(canCompleteServo(restored), false)
})
test('corrupt, missing and blocked storage return empty progress; quota failures return false', () => {
  const values = new Map(); storage(values)
  for (const content of [undefined, '{broken', 'null', '[]', '4']) {
    if (content === undefined) values.delete(servoStorageKey); else values.set(servoStorageKey, content)
    assert.equal(servoProgressPercent(loadServoProgress()), 0)
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Blocked') } })
  assert.equal(servoProgressPercent(loadServoProgress()), 0)
  assert.equal(saveServoProgress(ready()), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem() { throw Error('Quota') } } })
  assert.equal(saveServoProgress(ready()), false)
})
