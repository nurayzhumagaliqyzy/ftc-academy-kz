export type Theme = 'light' | 'dark'
export const themeStorageKey = 'ftc-academy:theme:v1'

export function normalizeTheme(value: unknown): Theme {
  return value === 'dark' ? 'dark' : 'light'
}

export function loadTheme(): Theme {
  try {
    return normalizeTheme(globalThis.localStorage.getItem(themeStorageKey))
  } catch {
    return 'light'
  }
}

export function saveTheme(theme: Theme): boolean {
  try {
    globalThis.localStorage.setItem(themeStorageKey, normalizeTheme(theme))
    return true
  } catch {
    return false
  }
}

export function applyTheme(theme: Theme, target: Document = document): void {
  target.documentElement.dataset.theme = theme
  target.documentElement.style.colorScheme = theme
  target.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a1221' : '#f2f6fa')
}
