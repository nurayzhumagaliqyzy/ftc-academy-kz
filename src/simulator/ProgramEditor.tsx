import { useLayoutEffect, useRef } from 'react'
import { commands, maxCommands, statusLabels } from './model'
import type { Command, Edit, SimulatorState } from './model'

export function ProgramEditor({ state, reduced, onEdit, onRun, onPause, onStep, onReset }: {
  state: SimulatorState; reduced: boolean; onEdit: (edit: Edit) => void
  onRun: () => void; onPause: () => void; onStep: () => void; onReset: () => void
}) {
  const active = state.status === 'running'
  const canRun = state.program.length > 0 && (state.status === 'idle' || state.status === 'paused')
  const firstCommand = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  useLayoutEffect(() => {
    if (restoreFocus.current) {
      restoreFocus.current = false
      firstCommand.current?.focus()
    }
  }, [state.program.length])
  return <section className="hw-panel rs-editor" aria-labelledby="rs-editor-title">
    <div className="hw-section-head"><div><p className="hw-kicker">AUTONOMOUS · ЕРКІН БАҒДАРЛАМА</p>
      <h2 id="rs-editor-title">Пәрмен редакторы</h2></div><span className="hw-count">{state.program.length}/{maxCommands}</span></div>
    <p>Пәрмен қосып, ↑/↓ арқылы ретте. Run қазіргі робот күйінен бастайды. Үзілістегі өңдеу тізімді басына қояды, роботты жылжытпайды.</p>
    <div className="rs-palette">{(Object.keys(commands) as Command[]).map((command, i) =>
      <button key={command} ref={i === 0 ? firstCommand : undefined} type="button" className="hw-button hw-button-secondary"
        disabled={active || state.program.length >= maxCommands} onClick={() => onEdit({ type: 'add', command })}
        aria-label={'Пәрмен қосу: ' + commands[command]}>{commands[command]}</button>)}</div>
    {!state.program.length && <p className="hw-note">Тізім бос. Жоғарыдағы дайын пәрменнен баста.</p>}
    <ol className="rs-program" aria-label="Autonomous пәрмен тізімі">{state.program.map((command, i) =>
      <li key={i} aria-current={state.lastIndex === i ? 'step' : undefined} data-next={state.nextIndex === i || undefined}>
        <span>{i + 1}. {commands[command]}{state.lastIndex === i ? ' · соңғы орындалған' : state.nextIndex === i ? ' · келесі' : ''}</span>
        <div>
          <button type="button" disabled={active || i === 0} aria-label={(i + 1) + '-пәрменді жоғары'} onClick={() => onEdit({ type: 'move', index: i, delta: -1 })}>↑</button>
          <button type="button" disabled={active || i === state.program.length - 1} aria-label={(i + 1) + '-пәрменді төмен'} onClick={() => onEdit({ type: 'move', index: i, delta: 1 })}>↓</button>
          <button type="button" disabled={active} aria-label={(i + 1) + '-пәрменді өшіру'} onClick={event => {
            restoreFocus.current = event.detail === 0
            onEdit({ type: 'delete', index: i })
          }}>×</button>
        </div>
      </li>)}</ol>
    <p className="hw-muted">{statusLabels[state.status]} · келесі индекс {state.nextIndex}/{state.program.length}. Бұл — дайын әрекеттер тізімі, Java коды емес.</p>
    <div className="hw-actions">
      <button type="button" className="hw-button" disabled={!canRun || reduced} onClick={onRun}>{state.status === 'paused' ? 'Жалғастыру' : 'Run · орындау'}</button>
      <button type="button" className="hw-button hw-button-secondary" disabled={!active} onClick={onPause}>Pause · үзіліс</button>
      <button type="button" className="hw-button hw-button-secondary" disabled={!canRun} onClick={onStep}>Step · бір пәрмен</button>
      <button type="button" className="hw-button hw-button-secondary" onClick={onReset}>Орындауды басына</button>
      <button type="button" className="hw-button hw-button-secondary" disabled={active || !state.program.length} onClick={() => onEdit({ type: 'clear' })}>Тізімді тазарту</button>
    </div>
    {reduced && <p className="hw-note">Reduced motion қосулы: автоматты Run өшірілді. Step арқылы барлық әрекетті орындауға болады.</p>}
    <details className="rs-help"><summary>IF-OBSTACLE және Stop ережесі</summary>
      <p>IF-OBSTACLE алдағы қашықтықты дәл қазір қайта оқиды. Келесі ұяшық жабық болса (0 бос ұяшық) — солға 90° бұрылады; әйтпесе бір ұяшық алға жүреді. Read Distance тек бақылауды сақтайды, қозғалтпайды.</p>
      <p>Stop тізімді тоқтатып, кейінгі пәрмендерді орындамайды. Stop-сыз біткен тізім де жай аяқталады: мұнда міндетті миссия, ұпай немесе өту шегі жоқ.</p>
    </details>
  </section>
}
