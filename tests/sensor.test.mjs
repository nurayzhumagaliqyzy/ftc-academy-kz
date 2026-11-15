import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  normalizeLabDistance, normalizeStopThreshold, obstacleOutput, sensorLabCode,
  sensorChallenges, evaluateSensorChallenge, sensorReadings, sensorCodeTasks, sensorQuestions, sensorScenario,
  sensorStorageKey, normalizeSensorProgress, canCompleteSensor, sensorProgressPercent, sensorCodeScore,
  sensorQuizScore, sensorQuizPassed, loadSensorProgress, saveSensorProgress,
} from '../src/programming/sensorModel.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'
import { storageKey, legacyStorageKey } from '../src/programming/model.ts'
import { motorStorageKey, legacyMotorStorageKey } from '../src/programming/motorModel.ts'
import { gamepadStorageKey, legacyGamepadStorageKey } from '../src/programming/gamepadModel.ts'
import { autonomousStorageKey, legacyAutonomousStorageKey } from '../src/programming/autonomousModel.ts'
import { servoStorageKey } from '../src/programming/servoModel.ts'

const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
  else delete globalThis.localStorage
})
function ready() {
  return normalizeSensorProgress({ read: sensorReadings.map(item => item.id), solved: sensorChallenges.map(item => item.id),
    code: Object.fromEntries(sensorCodeTasks.map(item => [item.id, item.answer])),
    answers: Object.fromEntries(sensorQuestions.map(item => [item.id, item.answer])), scenarioAnswer: sensorScenario.answer })
}
function mockStorage(values) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } })
}
test('first six lesson routes remain stable and final-project routes remain absent', () => {
  assert.deepEqual(programmingLessons.slice(0, 6).map(item => programmingSectionFor(item.hash)), ['sdk-opmode', 'dc-motor', 'gamepad-teleop', 'autonomous', 'servo', 'sensors'])
  assert.equal(new Set(programmingLessons.map(item => item.hash)).size, programmingLessons.length)
  for (const slug of ['integrated-challenge', '7', '8', 'sensors/other']) assert.equal(programmingSectionFor('programming/' + slug), undefined)
})
test('valid distance below/equal/above threshold selects 0/0/0.3, without rounding raw measurements', () => {
  for (const [distance, threshold, power] of [[15,20,0],[20,20,0],[20.000001,20,.3],[19.999999,20,0],[35,20,.3],[0,20,0],[-5,20,0],[1000,20,.3],[5,5,0],[100,50,.3]]) {
    assert.equal(obstacleOutput(distance, threshold).power, power)
    assert.equal(obstacleOutput(distance, threshold).finite, true)
  }
  // Finite is not a promise of physical sensor accuracy/range; the Java example has the same limitation.
  for (let threshold = 5; threshold <= 50; threshold++) {
    for (let distance = 5; distance <= 100; distance++) assert.equal(obstacleOutput(distance, threshold).power, distance > threshold ? .3 : 0)
  }
})
test('NaN, infinities and non-number inputs fail closed; invalid thresholds do not permit power', () => {
  for (const value of [NaN, Infinity, -Infinity, undefined, null, '35', {}, []]) {
    const output = obstacleOutput(value, 20)
    assert.equal(output.power, 0); assert.equal(output.finite, false); assert.equal(output.reason, 'invalid')
  }
  for (const threshold of [NaN, Infinity, -Infinity, 0, -1, undefined, '20']) {
    assert.equal(obstacleOutput(35, threshold).power, 0)
    assert.equal(obstacleOutput(35, threshold).reason, 'invalid-threshold')
  }
})
test('Lab sliders clamp/round their own UI values; raw NaN never becomes a valid controller reading', () => {
  for (const [input, distance, threshold] of [[-1,5,5],[0,5,5],[15.4,15,15],[20,20,20],[49.8,50,50],[500,100,50]]) {
    assert.equal(normalizeLabDistance(input), distance); assert.equal(normalizeStopThreshold(input), threshold)
  }
  for (const input of [NaN, Infinity, undefined, null, '15']) {
    assert.equal(normalizeLabDistance(input), 40); assert.equal(normalizeStopThreshold(input), 20)
    assert.equal(obstacleOutput(input, 20).power, 0)
  }
  for (const threshold of [5, 20, 50]) {
    const code = sensorLabCode(threshold)
    assert.ok(code.includes(`double stopDistanceCm = ${threshold.toFixed(1)};`))
    assert.ok(code.includes('!Double.isFinite(distanceCm) || distanceCm <= stopDistanceCm'))
    assert.ok(code.includes('sensor.getDistance(DistanceUnit.CM)'))
  }
})
test('three Lab challenges require exact input, stop action AND distinct correct explanations', () => {
  for (const item of sensorChallenges) {
    const reading = item.invalid ? NaN : item.distance
    assert.equal(evaluateSensorChallenge(item.id, reading, 20, 'stop', item.answer).correct, true)
    assert.equal(obstacleOutput(reading, 20).power, 0)
    for (const action of ['permit', 'reverse', undefined]) assert.equal(evaluateSensorChallenge(item.id, reading, 20, action, item.answer).correct, false)
    for (let answer = 0; answer < item.explanations.length; answer++) {
      if (answer !== item.answer) assert.equal(evaluateSensorChallenge(item.id, reading, 20, 'stop', answer).correct, false)
    }
    assert.equal(evaluateSensorChallenge(item.id, reading, 19, 'stop', item.answer).correct, false)
    assert.equal(evaluateSensorChallenge(item.id, item.invalid ? Infinity : item.distance + 1, 20, 'stop', item.answer).correct, false)
    assert.equal(evaluateSensorChallenge(item.id, reading, 20, 'stop', undefined).correct, false)
  }
  assert.equal(evaluateSensorChallenge('bad',15,20,'stop',0).correct, false)
  assert.equal(evaluateSensorChallenge('detect',NaN,20,'stop',0).correct, false)
  assert.equal(evaluateSensorChallenge('failure',40,20,'stop',2).correct, false)
})
test('all five meaningful Java answers are required, including non-finite OR threshold condition', () => {
  const progress = ready(); assert.equal(sensorCodeScore(progress), 5)
  for (const task of sensorCodeTasks) {
    for (const option of task.options) {
      const changed = { ...progress, code: { ...progress.code, [task.id]: option } }
      assert.equal(sensorCodeScore(changed), option === task.answer ? 5 : 4)
      assert.equal(canCompleteSensor(changed), option === task.answer)
    }
  }
})
test('quiz requires five attempted questions and 4/5; diagnostic scenario is a separate requirement', () => {
  const progress = ready()
  delete progress.answers.invalid
  assert.equal(sensorQuizScore(progress), 4); assert.equal(sensorQuizPassed(progress), false)
  progress.answers.invalid = 0
  assert.equal(sensorQuizPassed(progress), true)
  assert.equal(canCompleteSensor({ ...progress, scenarioAnswer: undefined }), false)
  assert.equal(canCompleteSensor({ ...progress, scenarioAnswer: 1 }), false)
  progress.answers.equality = 1
  assert.equal(sensorQuizScore(progress), 3); assert.equal(sensorQuizPassed(progress), false)
})
test('NaN diagnostic reproduces the faulty branch; corrected controller also covers equality', () => {
  const faultyPower = value => value < 20 ? 0 : .3
  assert.equal(faultyPower(NaN), .3)
  assert.equal(faultyPower(20), .3)
  assert.equal(obstacleOutput(NaN,20).power, 0)
  assert.equal(obstacleOutput(20,20).power, 0)
  assert.equal(obstacleOutput(21,20).power, .3)
})
test('every completion gate is necessary; 100% additionally requires explicit completion', () => {
  const progress = ready()
  assert.equal(canCompleteSensor(progress), true); assert.equal(progress.completed, false); assert.equal(sensorProgressPercent(progress), 91)
  assert.equal(sensorProgressPercent(normalizeSensorProgress({ ...progress, completed: true })), 100)
  const omissions = [
    ...sensorReadings.map(item => ({ read: progress.read.filter(id => id !== item.id) })),
    ...sensorChallenges.map(item => ({ solved: progress.solved.filter(id => id !== item.id) })),
    ...sensorCodeTasks.map(item => ({ code: { ...progress.code, [item.id]: undefined } })),
    { answers: {} }, { scenarioAnswer: undefined },
  ]
  for (const omission of omissions) {
    const result = normalizeSensorProgress({ ...progress, completed: true, ...omission })
    assert.equal(result.completed, false); assert.equal(canCompleteSensor(result), false); assert.ok(sensorProgressPercent(result) < 100)
  }
})
test('normalization rejects corrupt ids/answers and completion; duplicate evidence cannot inflate scores', () => {
  const result = normalizeSensorProgress({ read: ['conditions','conditions','bad'], solved: ['failure','failure','bad'], code: { type: 'DcMotor', read: 'bad' }, answers: { roles: 0, unit: '1', branch: .5, invalid: 99 }, scenarioAnswer: 10, completed: true })
  assert.deepEqual(result, { assessmentVersion: 1, previouslyCompleted: false, read: ['conditions'], solved: ['failure'], code: { type: 'DcMotor' }, answers: { roles: 0 }, completed: false })
  for (const input of [null,[],4,'bad',{completed:true}]) assert.equal(sensorProgressPercent(normalizeSensorProgress(input)), 0)
})
test('partial/full Sensor persistence and independent retries leave five lessons, backups and Hardware byte-identical', () => {
  const oldKeys = [storageKey,legacyStorageKey,motorStorageKey,legacyMotorStorageKey,gamepadStorageKey,legacyGamepadStorageKey,autonomousStorageKey,legacyAutonomousStorageKey,servoStorageKey,'ftc-academy-kz:hardware:v1']
  const values = new Map(oldKeys.map(key => [key, `existing:${key}`])); const before = new Map(values); mockStorage(values)
  saveSensorProgress({ ...loadSensorProgress(), solved: ['detect','detect'] })
  assert.deepEqual(loadSensorProgress().solved, ['detect'])
  assert.equal(saveSensorProgress({ ...ready(), completed: true }), true)
  const complete = loadSensorProgress(); assert.equal(complete.completed,true)
  for (const change of [{ solved: [] },{ answers: {} },{ scenarioAnswer: undefined }]) {
    saveSensorProgress({ ...complete, ...change, completed: false }); const result = loadSensorProgress()
    assert.equal(result.completed,false); assert.deepEqual(result.read,complete.read); assert.deepEqual(result.code,complete.code)
    if (!('solved' in change)) assert.deepEqual(result.solved,complete.solved)
    if (!('answers' in change)) assert.deepEqual(result.answers,complete.answers)
    if (!('scenarioAnswer' in change)) assert.equal(result.scenarioAnswer,complete.scenarioAnswer)
  }
  for (const [key,value] of before) assert.equal(values.get(key),value)
  assert.equal(values.size,before.size+1)
  assert.equal(new Set([...oldKeys,sensorStorageKey]).size,oldKeys.length+1)
})
test('missing/corrupt/blocked storage and quota exhaustion leave a usable empty/in-memory lesson', () => {
  const values = new Map(); mockStorage(values)
  for (const text of [undefined,'{bad','null','[]','4']) {
    if (text === undefined) values.delete(sensorStorageKey); else values.set(sensorStorageKey,text)
    assert.equal(sensorProgressPercent(loadSensorProgress()),0)
  }
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('Blocked')}})
  assert.equal(sensorProgressPercent(loadSensorProgress()),0); assert.equal(saveSensorProgress(ready()),false)
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem(){throw Error('Quota')}}})
  assert.equal(saveSensorProgress(ready()),false)
})
