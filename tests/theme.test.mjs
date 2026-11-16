import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { applyTheme, loadTheme, normalizeTheme, saveTheme, themeStorageKey } from '../src/theme.ts'

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original)
  else delete globalThis.localStorage
})
function storage(values = new Map()) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } })
  return values
}
function documentStub() {
  return {
    documentElement: { dataset: {}, style: {} },
    meta: {},
    querySelector() { return { setAttribute: (name, value) => { this.meta[name] = value } } },
  }
}

test('theme defaults to light and accepts only the exact saved dark value', () => {
  const values = storage()
  for (const value of [null, '', 'LIGHT', 'DARK', '{broken', '"dark"', 'system', ' light ']) {
    values.set(themeStorageKey, value)
    assert.equal(loadTheme(), 'light')
    assert.equal(normalizeTheme(value), 'light')
  }
  values.set(themeStorageKey, 'dark')
  assert.equal(loadTheme(), 'dark')
  values.set(themeStorageKey, 'light')
  assert.equal(loadTheme(), 'light')
})

test('theme persists across reloads without modifying existing progress or migrations', () => {
  const modelPaths = ['hardware/model', 'programming/model', ...['motor', 'gamepad',
    'autonomous', 'servo', 'sensor', 'encoder', 'integrated'].map(name => `programming/${name}Model`)]
  const keys = modelPaths.flatMap(path => [...readFileSync(new URL(`../src/${path}.ts`, import.meta.url), 'utf8')
    .matchAll(/['"](ftc-academy-kz:[^'"]+)['"]/g)].map(match => match[1]))
  const before = new Map(keys.map(key => [key, '{"completed":true,"assessmentVersion":1}']))
  const values = storage(new Map(before))
  assert.equal(saveTheme('dark'), true)
  assert.equal(loadTheme(), 'dark')
  assert.equal(saveTheme('light'), true)
  assert.equal(loadTheme(), 'light')
  assert.deepEqual(new Map([...values].filter(([key]) => key !== themeStorageKey)), before)
  assert.equal(values.size, before.size + 1)
})

test('unavailable, blocked and quota-limited storage never prevents switching', () => {
  delete globalThis.localStorage
  assert.equal(loadTheme(), 'light')
  assert.equal(saveTheme('dark'), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Blocked') } })
  assert.equal(loadTheme(), 'light')
  assert.equal(saveTheme('dark'), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem() { throw Error('Blocked read') }, setItem() { throw Error('Quota') },
  } })
  assert.equal(loadTheme(), 'light')
  assert.equal(saveTheme('dark'), false)
  const target = documentStub()
  applyTheme('dark', target)
  assert.equal(target.documentElement.dataset.theme, 'dark')
})

test('theme application updates root, native color scheme and browser metadata', () => {
  const target = documentStub()
  for (const theme of ['dark', 'light']) {
    applyTheme(theme, target)
    assert.equal(target.documentElement.dataset.theme, theme)
    assert.equal(target.documentElement.style.colorScheme, theme)
    assert.equal(target.meta.content, theme === 'dark' ? '#0a1221' : '#f2f6fa')
  }
  target.querySelector = () => null
  assert.doesNotThrow(() => applyTheme('dark', target))
})

test('pre-paint bootstrap matches runtime preference rules and never writes storage', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  assert.ok(html.indexOf('<script>') < html.indexOf('type="module"'))
  assert.ok(script.includes(themeStorageKey))
  for (const saved of [null, 'dark', 'light', 'malformed', '"dark"']) {
    const target = documentStub()
    runInNewContext(script, { document: target, localStorage: { getItem: () => saved } })
    assert.equal(target.documentElement.dataset.theme, normalizeTheme(saved))
    assert.equal(target.documentElement.style.colorScheme, normalizeTheme(saved))
  }
  const target = documentStub()
  const context = { document: target }
  Object.defineProperty(context, 'localStorage', { get() { throw Error('Blocked') } })
  assert.doesNotThrow(() => runInNewContext(script, context))
  assert.equal(target.documentElement.dataset.theme, 'light')
})

function contrast(a, b) {
  const lum = hex => {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map(v => parseInt(v, 16) / 255)
    return rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
      .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
  }
  const [x, y] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (x + .05) / (y + .05)
}
test('light text and meaningful UI palette pairs meet AA contrast targets', () => {
  const css = readFileSync(new URL('../src/theme.css', import.meta.url), 'utf8')
  const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+): (#[\da-f]{6});/g)].map(m => [m[1], m[2]]))
  for (const [ink, paper] of [
    ['text-primary','panel-bg'], ['text-secondary','panel-bg'], ['text-muted','surface-inset'],
    ['accent-text','panel-bg'], ['button-text','button-bg'], ['button-text','button-hover-bg'],
    ['code-text','code-bg'], ['success-text','success-bg'], ['error-text','error-bg'],
    ['warning-text','warning-bg'], ['diagram-text','diagram-bg'], ['diagram-ink','diagram-bright'],
    ['wall-ink','wall-bg'], ['zone-ink','zone-bg'], ['object-color','diagram-bg'],
  ]) assert.ok(contrast(tokens[ink], tokens[paper]) >= 4.5, `${ink} / ${paper}`)
  for (const [ink, paper] of [['border-control','input-bg'], ['focus-ring','panel-bg'],
    ['diagram-stroke','diagram-surface'], ['field-grid','diagram-bg'], ['trail-color','diagram-bg']]) {
    assert.ok(contrast(tokens[ink], tokens[paper]) >= 3, `${ink} / ${paper}`)
  }
})

test('representative preserved dark text and status pairs meet AA contrast', () => {
  for (const [ink, paper] of [['#edf5ff','#0a1221'], ['#a9b8ca','#101c2f'],
    ['#63e4f4','#101c2f'], ['#092234','#8beaf6'], ['#83efc1','#102e2b'],
    ['#ffadb1','#391e2b'], ['#b1eff9','#091522']]) {
    assert.ok(contrast(ink, paper) >= 4.5, `${ink} / ${paper}`)
  }
})

test('semantic roles with dark fallback behavior always include a use-site fallback', () => {
  const palette = readFileSync(new URL('../src/theme.css', import.meta.url), 'utf8')
  const fallbackRoles = new Set([...palette.matchAll(/--([\w-]+): initial;/g)].map(m => m[1]))
  const files = ['styles.css', 'hardware/hardware.css', 'programming/MotorLab.tsx', 'simulator/simulator.css',
    ...['programming','motor','gamepad','autonomous','servo','sensor','encoder','integrated'].map(n => `programming/${n}.css`)]
  for (const file of files) {
    const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
    for (const match of source.matchAll(/var\(--([\w-]+)\s*([,)])/g)) {
      if (fallbackRoles.has(match[1])) assert.equal(match[2], ',', `${file}: ${match[1]} needs its dark fallback`)
    }
  }
})
