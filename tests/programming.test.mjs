import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  sdkScenario, canComplete, concepts, loadProgress, matchingScore, normalizeProgress,
  progressPercent, questions, quizPassed, quizScore, readingSections, saveProgress, storageKey,
} from '../src/programming/model.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})

function readyProgress() {
  return normalizeProgress({ assessmentVersion: 2, scenarioAnswer: sdkScenario.answer,
    read: readingSections.map(section => section.id),
    matches: Object.fromEntries(concepts.map(concept => [concept.id, concept.answer])),
    answers: Object.fromEntries(questions.map(question => [question.id, question.answer])),
  })
}

test('fresh and malformed progress starts safely without false completion', () => {
  for (const value of [null, [], 'bad', 12, { completed: true }]) {
    const progress = normalizeProgress(value)
    assert.equal(progressPercent(progress), 0)
    assert.equal(progress.completed, false)
    assert.equal(canComplete(progress), false)
  }
  assert.deepEqual(normalizeProgress({
    read: ['intro', 'intro', 'unknown'],
    matches: { sdk: 'tools', active: 'unknown', unexpected: 'tools' },
    answers: { sdk: 99, opmode: -1, modes: 0.5, start: '1', telemetry: 0 },
    completed: true,
  }), { assessmentVersion: 2, previouslyCompleted: false, read: ['intro'], matches: { sdk: 'tools' }, answers: { telemetry: 0 }, completed: false })
})

test('completion requires theory, correct matches, all quiz answers, and 4/5', () => {
  const progress = readyProgress()
  assert.equal(matchingScore(progress), 5)
  assert.equal(quizScore(progress), 5)
  assert.equal(canComplete(progress), true)
  assert.equal(progressPercent(progress), 88)
  progress.answers.sdk = 0
  assert.equal(quizPassed(progress), true)
  progress.completed = true
  assert.equal(progressPercent(progress), 100)
  progress.answers.opmode = 1
  assert.equal(quizPassed(progress), false)
  assert.equal(normalizeProgress(progress).completed, false)
  assert.equal(canComplete({ ...readyProgress(), read: ['intro'] }), false)
  assert.equal(canComplete({ ...readyProgress(), matches: {} }), false)
  const partial = readyProgress()
  delete partial.answers.sdk
  assert.equal(quizScore(partial), 4)
  assert.equal(quizPassed(partial), false)
})

test('completed progress and wrong answers survive a storage round trip', () => {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } })
  const progress = readyProgress()
  progress.answers.sdk = 0
  progress.completed = true
  assert.equal(saveProgress(progress), true)
  assert.deepEqual(loadProgress(), progress)
  assert.equal(loadProgress().completed, true)
  values.set(storageKey, '{invalid json')
  assert.equal(progressPercent(loadProgress()), 0)
})

test('blocked storage and quota errors keep the lesson usable', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Blocked') } })
  assert.equal(progressPercent(loadProgress()), 0)
  assert.equal(saveProgress(readyProgress()), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem() { return null }, setItem() { throw new Error('Quota exceeded') },
  } })
  assert.equal(saveProgress(readyProgress()), false)
})

test('retrying the quiz preserves reading and matches but removes completion', () => {
  const completed = { ...readyProgress(), completed: true }
  const retry = normalizeProgress({ ...completed, answers: {}, completed: false })
  assert.deepEqual(retry.read, completed.read)
  assert.deepEqual(retry.matches, completed.matches)
  assert.equal(quizScore(retry), 0)
  assert.equal(canComplete(retry), false)
  assert.equal(retry.completed, false)
})
