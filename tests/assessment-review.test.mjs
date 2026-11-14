import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as sdk from '../src/programming/model.ts'
import * as motor from '../src/programming/motorModel.ts'
import * as gamepad from '../src/programming/gamepadModel.ts'
import * as auto from '../src/programming/autonomousModel.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})
const answers = questions => Object.fromEntries(questions.map(question => [question.id, question.answer]))
const code = tasks => Object.fromEntries(tasks.map(task => [task.id, task.answer]))
const oldRecords = [
  { read: sdk.readingSections.map(section => section.id), matches: Object.fromEntries(sdk.concepts.map(concept => [concept.id, concept.answer])), answers: answers(sdk.questions), completed: true },
  { read: motor.motorReadings.map(section => section.id), code: code(motor.codeTasks), answers: answers(motor.motorQuestions), labDone: true, completed: true },
  { read: gamepad.gamepadReadings.map(section => section.id), code: code(gamepad.gamepadCodeTasks), answers: answers(gamepad.gamepadQuestions), labDone: true, completed: true },
  { read: auto.autonomousReadings.map(section => section.id), solved: auto.challenges.map(challenge => challenge.id), code: code(auto.autonomousCodeTasks), answers: answers(auto.autonomousQuestions), completed: true },
]
const lessons = [
  { name: 'SDK', key: sdk.storageKey, legacy: sdk.legacyStorageKey, normalize: sdk.normalizeProgress, load: sdk.loadProgress, save: sdk.saveProgress, can: sdk.canComplete, percent: sdk.progressPercent, scenario: sdk.sdkScenario },
  { name: 'Motor', key: motor.motorStorageKey, legacy: motor.legacyMotorStorageKey, normalize: motor.normalizeMotorProgress, load: motor.loadMotorProgress, save: motor.saveMotorProgress, can: motor.canCompleteMotor, percent: motor.motorProgressPercent, scenario: motor.motorScenario },
  { name: 'Gamepad', key: gamepad.gamepadStorageKey, legacy: gamepad.legacyGamepadStorageKey, normalize: gamepad.normalizeGamepadProgress, load: gamepad.loadGamepadProgress, save: gamepad.saveGamepadProgress, can: gamepad.canCompleteGamepad, percent: gamepad.gamepadProgressPercent, scenario: gamepad.gamepadScenario },
  { name: 'Autonomous', key: auto.autonomousStorageKey, legacy: auto.legacyAutonomousStorageKey, normalize: auto.normalizeAutonomousProgress, load: auto.loadAutonomousProgress, save: auto.saveAutonomousProgress, can: auto.canCompleteAutonomous, percent: auto.autonomousProgressPercent, scenario: auto.autonomousScenario },
]
function currentReady(index) {
  return lessons[index].normalize({ ...oldRecords[index], assessmentVersion: 2, scenarioAnswer: lessons[index].scenario.answer,
    ...(index === 1 ? { labChecks: motor.motorChecks.map(check => check.id) } : {}), completed: false })
}
function installStorage(values) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
  } })
}

lessons.forEach((lesson, index) => {
  test(`${lesson.name}: migrate genuine v1 completion as history without awarding unperformed assessments`, () => {
    const old = oldRecords[index]
    const migrated = lesson.normalize(old)
    for (const [key, value] of Object.entries(old)) if (key !== 'completed') assert.deepEqual(migrated[key], value)
    assert.equal(migrated.assessmentVersion, 2)
    assert.equal(migrated.previouslyCompleted, true)
    assert.equal(migrated.completed, false)
    assert.equal(migrated.scenarioAnswer, undefined)
    assert.equal(lesson.can(migrated), false)
    assert.ok(lesson.percent(migrated) < 100)
    assert.deepEqual(lesson.normalize(migrated), migrated)
    assert.equal(lesson.normalize({ ...old, completed: false }).previouslyCompleted, false)
    assert.equal(lesson.normalize({ completed: true }).previouslyCompleted, false)
    assert.equal(lesson.normalize({ ...old, assessmentVersion: 99 }).previouslyCompleted, false)
  })
  test(`${lesson.name}: current completion requires the correct scenario separately from the unchanged quiz`, () => {
    const ready = currentReady(index)
    assert.equal(lesson.can(ready), true)
    assert.equal(lesson.normalize({ ...ready, completed: true }).completed, true)
    for (const scenarioAnswer of [undefined, (lesson.scenario.answer + 1) % 3, -1, 3, 0.5, '0', NaN]) {
      const changed = lesson.normalize({ ...ready, scenarioAnswer, completed: true })
      assert.equal(lesson.can(changed), false)
      assert.equal(changed.completed, false)
      assert.deepEqual(changed.answers, ready.answers)
    }
  })
  test(`${lesson.name}: v2 round-trip takes priority, leaves every v1 backup intact, and recovers corrupt JSON`, () => {
    const values = new Map(oldRecords.map((record, i) => [lessons[i].legacy, JSON.stringify(record)]))
    values.set('ftc-academy-kz:hardware:v1', '{"explored":["control-hub"]}')
    const backup = new Map(values)
    installStorage(values)
    const migrated = lesson.load()
    assert.equal(migrated.previouslyCompleted, true)
    assert.equal(lesson.save(migrated), true)
    assert.deepEqual(lesson.load(), migrated)
    const ready = { ...currentReady(index), completed: true }
    assert.equal(lesson.save(ready), true)
    assert.deepEqual(lesson.load(), ready)
    assert.equal(lesson.load().previouslyCompleted, false)
    for (const [key, value] of backup) assert.equal(values.get(key), value)
    assert.equal(new Set([...lessons.map(item => item.key), ...lessons.map(item => item.legacy)]).size, 8)
    for (const invalid of ['{broken', 'null', '[]']) {
      values.set(lesson.key, invalid)
      assert.deepEqual(lesson.load(), migrated)
    }
  })
})

test('Motor: a legacy start/stop flag never satisfies the new Lab requirements', () => {
  const progress = motor.normalizeMotorProgress({ ...oldRecords[1], scenarioAnswer: motor.motorScenario.answer })
  assert.equal(progress.labDone, true)
  assert.deepEqual(progress.labChecks, [])
  assert.equal(motor.motorLabPassed(progress), false)
  assert.equal(motor.canCompleteMotor(progress), false)
  for (const labChecks of [['forward-positive'], ['forward-positive', 'reverse-negative'], ['zero']]) {
    assert.equal(motor.canCompleteMotor(motor.normalizeMotorProgress({ ...progress, labChecks, completed: true })), false)
  }
  assert.equal(motor.canCompleteMotor({ ...progress, labChecks: motor.motorChecks.map(check => check.id) }), true)
})
test('Motor: correct interpretation AND the requested power/direction/running state are required', () => {
  const check = motor.checkMotorUnderstanding
  assert.equal(check('forward-positive', 0.5, 'FORWARD', true, 'primary').correct, true)
  assert.equal(check('forward-positive', 0.5, 'FORWARD', true, 'opposite').correct, false)
  assert.equal(check('forward-positive', 0.5, 'FORWARD', false, 'primary').correct, false)
  assert.equal(check('forward-positive', 0.5, 'REVERSE', true, 'primary').correct, false)
  assert.equal(check('reverse-negative', -0.5, 'REVERSE', true, 'primary').correct, true)
  assert.equal(check('reverse-negative', -0.5, 'REVERSE', true, 'opposite').correct, false)
  assert.equal(check('reverse-negative', 0.5, 'REVERSE', true, 'primary').correct, false)
  assert.equal(check('reverse-negative', -0.5, 'FORWARD', true, 'primary').correct, false)
  for (const direction of ['FORWARD', 'REVERSE']) {
    assert.equal(check('zero', 0, direction, false, 'zero').correct, true)
    assert.equal(check('zero', 0, direction, false, 'primary').correct, false)
    assert.equal(check('zero', -0.5, direction, false, 'zero').correct, false)
  }
  assert.equal(check('zero', Infinity, 'FORWARD', false, 'zero').correct, false)
  assert.equal(check('unknown', 0, 'FORWARD', false, 'zero').correct, false)
})
test('Motor: assessment evidence filters duplicates and unknown stages and survives a round trip', () => {
  const progress = motor.normalizeMotorProgress({ ...currentReady(1), labChecks: ['zero', 'zero', 'unknown', 'forward-positive'] })
  assert.deepEqual(progress.labChecks, ['forward-positive', 'zero'])
  assert.equal(motor.motorLabPassed(progress), false)
  const values = new Map(); installStorage(values)
  motor.saveMotorProgress(progress)
  assert.deepEqual(motor.loadMotorProgress(), progress)
  const reset = motor.normalizeMotorProgress({ ...currentReady(1), labChecks: [], completed: true })
  assert.equal(reset.completed, false)
  assert.deepEqual(reset.code, progress.code)
  assert.deepEqual(reset.answers, progress.answers)
})
test('Scenario interpretations agree with motor, Gamepad and Autonomous execution models', () => {
  assert.equal(motor.motorOutput(0.5, 'FORWARD', true).rotation, 'clockwise')
  assert.equal(motor.motorOutput(0.5, 'REVERSE', true).rotation, 'counterclockwise')
  assert.equal(gamepad.gamepadOutput(0.6).power, -0.6)
  const challenge = { ...auto.challenges[0], target: { x: 2, y: 2 } }
  function execute(commands) {
    let state = { ...auto.initialExecution(challenge), status: 'running' }
    for (let i = 0; i < commands.length && state.status === 'running'; i++) state = auto.advanceExecution(state, commands, challenge)
    return state
  }
  assert.deepEqual(execute(['forward', 'left', 'forward', 'stop']).pose, { x: 0, y: 2, direction: 3 })
  assert.equal(execute(['forward', 'right', 'forward', 'stop']).status, 'success')
})
test('Scenario retry preserves quiz/activity work; quiz retry preserves the scenario in all lessons', () => {
  lessons.forEach((lesson, index) => {
    const ready = { ...currentReady(index), completed: true }
    const scenarioRetry = lesson.normalize({ ...ready, scenarioAnswer: undefined, completed: false })
    assert.deepEqual(scenarioRetry.answers, ready.answers)
    assert.deepEqual(scenarioRetry.read, ready.read)
    assert.equal(scenarioRetry.completed, false)
    const quizRetry = lesson.normalize({ ...ready, answers: {}, completed: false })
    assert.equal(quizRetry.scenarioAnswer, lesson.scenario.answer)
    assert.equal(quizRetry.completed, false)
    for (const field of ['code', 'matches', 'solved', 'labChecks']) if (field in ready) {
      assert.deepEqual(scenarioRetry[field], ready[field]); assert.deepEqual(quizRetry[field], ready[field])
    }
  })
})
