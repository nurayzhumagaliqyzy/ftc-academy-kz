type Listener = () => void
export type PlaybackHost = {
  setInterval: (callback: Listener, delay: number) => number
  clearInterval: (id: number) => void
  document: { hidden: boolean; addEventListener: (name: string, listener: Listener) => void; removeEventListener: (name: string, listener: Listener) => void }
  addEventListener: (name: string, listener: Listener) => void
  removeEventListener: (name: string, listener: Listener) => void
}
// Timer paces discrete commands; elapsed time is never a physics input.
export function attachPlayback(host: PlaybackHost, tick: Listener, pause: Listener): Listener {
  let disposed = false
  const interrupt = () => { if (!disposed) pause() }
  const visibility = () => { if (host.document.hidden) interrupt() }
  const id = host.setInterval(() => { if (!disposed && !host.document.hidden) tick() }, 650)
  host.document.addEventListener('visibilitychange', visibility)
  host.addEventListener('blur', interrupt)
  return () => {
    disposed = true
    host.clearInterval(id)
    host.document.removeEventListener('visibilitychange', visibility)
    host.removeEventListener('blur', interrupt)
  }
}
