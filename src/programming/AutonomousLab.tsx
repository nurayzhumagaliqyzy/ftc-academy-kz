import { useEffect, useState } from 'react'
import {
  advanceExecution, challenges, commandOptions, directionNames, gridSize, initialExecution, maxCommands,
} from './autonomousModel'
import type { Challenge, Execution, PathCommand, Point } from './autonomousModel'

const cellSize = 56
const origin = 40
function center(point: Point) { return { x: origin + point.x * cellSize + cellSize / 2, y: origin + (gridSize - 1 - point.y) * cellSize + cellSize / 2 } }

export function AutonomousField({ challenge, execution }: { challenge: Challenge; execution: Execution }) {
  const robot = center(execution.pose)
  const start = center(challenge.start)
  const target = center(challenge.target)
  return <figure className="al-field">
    <svg viewBox="0 0 420 420" role="img" aria-labelledby="al-field-title al-field-description">
      <title id="al-field-title">Autonomous оқу өрісі · 6 × 6</title>
      <desc id="al-field-description">X оңға, Y жоғары өседі. Бастау ({challenge.start.x}, {challenge.start.y}); нысана ({challenge.target.x}, {challenge.target.y}); робот ({execution.pose.x}, {execution.pose.y}), {directionNames[execution.pose.direction]}. Сұр ұяшықтар — кедергілер.</desc>
      <rect x={origin} y={origin} width={gridSize * cellSize} height={gridSize * cellSize} className="al-field-background" />
      {Array.from({ length: gridSize + 1 }, (_, index) => <g key={index} className="al-grid-lines"><line x1={origin + index * cellSize} y1={origin} x2={origin + index * cellSize} y2={origin + gridSize * cellSize} /><line x1={origin} y1={origin + index * cellSize} x2={origin + gridSize * cellSize} y2={origin + index * cellSize} /></g>)}
      {Array.from({ length: gridSize }, (_, index) => <g key={index} className="al-coordinates"><text x={origin + index * cellSize + cellSize / 2} y="401" textAnchor="middle">{index}</text><text x="20" y={origin + (gridSize - 1 - index) * cellSize + cellSize / 2 + 5} textAnchor="middle">{index}</text></g>)}
      <text x="402" y="401" className="al-coordinates">x</text><text x="15" y="24" className="al-coordinates">y</text>
      {challenge.walls.map(wall => { const point = center(wall); return <g key={`${wall.x}-${wall.y}`}><rect x={point.x - 24} y={point.y - 24} width="48" height="48" rx="5" className="al-wall" /><path d={`M${point.x - 9} ${point.y - 9}l18 18m0 -18l-18 18`} className="al-wall-cross" /></g> })}
      <circle cx={start.x} cy={start.y} r="23" className="al-start" /><text x={start.x} y={start.y + 5} textAnchor="middle" className="al-start-label">Б</text>
      <rect x={target.x - 24} y={target.y - 24} width="48" height="48" rx="8" className="al-target" /><text x={target.x} y={target.y + 7} textAnchor="middle" className="al-target-label">◎</text>
      <polyline points={execution.path.map(point => { const p = center(point); return `${p.x},${p.y}` }).join(' ')} className="al-path" />
      {execution.path.map((point, index) => { const p = center(point); return <circle key={index} cx={p.x} cy={p.y} r="3" className="al-path-dot" /> })}
      <g className="al-robot-position" style={{ transform: `translate(${robot.x}px, ${robot.y}px)` }}>
        <g className="al-robot-direction" style={{ transform: `rotate(${execution.angle}deg)` }}>
          <rect x="-21" y="-12" width="7" height="24" rx="2" className="al-wheel" /><rect x="14" y="-12" width="7" height="24" rx="2" className="al-wheel" />
          <rect x="-15" y="-17" width="30" height="34" rx="7" className="al-robot-body" /><path d="M0 -24 L-8 -8 L8 -8 Z" className="al-robot-nose" /><circle r="5" className="al-robot-core" />
        </g>
      </g>
    </svg>
    <figcaption>Б — бастау · ◎ — нысана · сұр × — кедергі · көгілдір сызық — жүрілген жол. Үшбұрыш роботтың алдыңғы жағын көрсетеді.</figcaption>
  </figure>
}

export function AutonomousLab({ solved, onSolve }: { solved: readonly string[]; onSolve: (id: string) => void }) {
  const [challengeId, setChallengeId] = useState(challenges[0].id)
  const challenge = challenges.find(item => item.id === challengeId) ?? challenges[0]
  const [programs, setPrograms] = useState<Record<string, PathCommand[]>>({})
  const commands = programs[challenge.id] ?? []
  const [execution, setExecution] = useState(() => initialExecution(challenges[0]))
  const locked = execution.status === 'running' || execution.status === 'paused'
  const firstStop = commands.indexOf('stop')
  useEffect(() => {
    if (execution.status !== 'running') return
    const timer = window.setTimeout(() => setExecution(current => advanceExecution(current, commands, challenge)), 700)
    return () => window.clearTimeout(timer)
  }, [execution, commands, challenge])
  useEffect(() => {
    if (execution.status === 'success' && !solved.includes(challenge.id)) onSolve(challenge.id)
  }, [execution.status, challenge.id, solved, onSolve])
  useEffect(() => {
    const hide = () => { if (document.hidden) setExecution(current => current.status === 'running' ? { ...current, status: 'paused', message: 'Бет жасырылғандықтан орындалу кідіртілді. Жалғастыру үшін «Жалғастыру» батырмасын бас.' } : current) }
    document.addEventListener('visibilitychange', hide)
    return () => document.removeEventListener('visibilitychange', hide)
  }, [])
  function edit(change: (previous: PathCommand[]) => PathCommand[]) {
    if (locked) return
    setPrograms(previous => ({ ...previous, [challenge.id]: change(previous[challenge.id] ?? []).slice(0, maxCommands) }))
    setExecution(initialExecution(challenge))
  }
  function reorder(index: number, delta: number) {
    edit(previous => { const copy = [...previous]; const other = index + delta; if (other >= 0 && other < copy.length) [copy[index], copy[other]] = [copy[other], copy[index]]; return copy })
  }
  function start() {
    if (!commands.length || execution.status === 'running') return
    setExecution(current => ({ ...(current.status === 'paused' ? current : initialExecution(challenge)), status: 'running', message: 'Алгоритм орындалып жатыр. Әр пәрмен бірінен кейін бірі орындалады.' }))
  }
  function step() {
    if (!commands.length || execution.status === 'running') return
    setExecution(current => {
      const base = current.status === 'paused' ? current : initialExecution(challenge)
      const next = advanceExecution({ ...base, status: 'running' }, commands, challenge)
      return next.status === 'running' ? { ...next, status: 'paused' } : next
    })
  }
  return <section className="hw-panel al-lab" aria-labelledby="al-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">AUTONOMOUS PATH LAB / ОҚУ МОДЕЛІ</p><h2 id="al-lab" tabIndex={-1}>Алгоритм құрастыр, жолды тексер</h2></div><span className="hw-count">{solved.length}/3 орындалды</span></div>
    <p>Бұл — детерминдік торлы оқу моделі. Нақты FTC Drivetrain (роботтың жүріс жүйесі) немесе физика симуляторы емес. Бір «Алға» дәл бір ұяшыққа жылжытады; 90° бұрылу орынды өзгертпейді. Бұл дәлдік нақты роботқа берілетін уәде емес.</p>
    <div className="al-challenges" aria-label="Path Lab тапсырмалары">
      {challenges.map(item => <button key={item.id} type="button" className="hw-button hw-button-secondary" aria-pressed={item.id === challenge.id} disabled={locked} onClick={() => { setChallengeId(item.id); setExecution(initialExecution(item)) }}>{solved.includes(item.id) ? '✓ ' : ''}{item.title}</button>)}
    </div>
    <h3 className="al-challenge-title">{challenge.title}</h3><p>{challenge.description}</p>
    <div className="al-lab-grid">
      <div className="al-field-column">
        <AutonomousField challenge={challenge} execution={execution} />
        <dl className="al-position"><div><dt>Координата</dt><dd>({execution.pose.x}, {execution.pose.y})</dd></div><div><dt>Бағыт</dt><dd>{directionNames[execution.pose.direction]}</dd></div><div><dt>Тексерілген пәрмен</dt><dd>{execution.nextIndex}/{commands.length}</dd></div></dl>
        <div className="al-playback">
          <button type="button" className="hw-button" disabled={!commands.length || execution.status === 'running'} onClick={start}>{execution.status === 'paused' ? 'Жалғастыру' : 'Іске қосу'}</button>
          <button type="button" className="hw-button hw-button-secondary" disabled={execution.status !== 'running'} onClick={() => setExecution(current => current.status === 'running' ? { ...current, status: 'paused', message: 'Орындалу кідіртілді. Жол мен бағыт сақталды.' } : current)}>Кідірту</button>
          <button type="button" className="hw-button hw-button-secondary" disabled={!commands.length || execution.status === 'running'} onClick={step}>Бір қадам</button>
          <button type="button" className="hw-button hw-button-secondary" onClick={() => setExecution(initialExecution(challenge))}>Бастапқы күйге</button>
        </div>
        <div className="hw-feedback al-status" data-kind={execution.status === 'success' ? 'good' : ['blocked', 'stopped', 'finished'].includes(execution.status) ? 'bad' : undefined} role="status" aria-live="polite" aria-atomic="true">{execution.message}</div>
        <p className="hw-muted">«Бастапқы күйге» роботты, жолды және қадам санағын қайтарады; пәрмендер мен орындалған тапсырма белгілері сақталады. Қате жолды түзету үшін алдымен осы батырманы бас.</p>
      </div>
      <div className="al-program">
        <h3 id="al-program-title">Пәрмендер тізбегі</h3>
        <div className="al-command-picker" aria-label="Пәрмен қосу">
          {commandOptions.map(option => <button type="button" className="hw-button hw-button-secondary" key={option.id} disabled={locked || commands.length >= maxCommands} onClick={() => edit(previous => [...previous, option.id])}>
            <b>{option.symbol} {option.label}</b><small>{option.detail}</small>
          </button>)}
        </div>
        <p className="hw-muted">Қосу үшін пәрменді бас. ↑/↓ арқылы ретін өзгерт, × арқылы жой. Tab және Enter/Space пернелерімен де басқаруға болады. Іске қосқанда немесе кідірткенде тізім бекітіледі; өңдеу үшін бастапқы күйге қайтар.</p>
        <p className="al-command-count">{commands.length}/{maxCommands} пәрмен</p>
        {commands.length === 0 && <p className="hw-note">Тізім бос. Бастапқы бағытты қарап, алғашқы пәрменді қос.</p>}
        <ol className="al-command-list" aria-labelledby="al-program-title">
          {commands.map((command, index) => {
            const option = commandOptions.find(item => item.id === command)!
            return <li key={index} data-state={index === execution.nextIndex - 1 ? execution.status === 'blocked' ? 'blocked' : 'current' : index < execution.nextIndex ? 'done' : undefined}>
              <span className="al-command-name"><b>{index + 1}.</b> {option.symbol} {option.label}</span>
              <div className="al-command-actions">
                <button type="button" disabled={locked || index === 0} aria-label={`${index + 1}-пәрменді жоғары жылжыту`} onClick={() => reorder(index, -1)}>↑</button>
                <button type="button" disabled={locked || index === commands.length - 1} aria-label={`${index + 1}-пәрменді төмен жылжыту`} onClick={() => reorder(index, 1)}>↓</button>
                <button type="button" disabled={locked} aria-label={`${index + 1}-пәрменді жою`} onClick={() => edit(previous => previous.filter((_, i) => i !== index))}>×</button>
              </div>
            </li>
          })}
        </ol>
        <button type="button" className="hw-button hw-button-secondary" disabled={locked || !commands.length} onClick={() => edit(() => [])}>Тізімді тазалау</button>
        {commands.length >= maxCommands && <p role="status">Шекке жеттің: артық пәрменді жой немесе тізімді ықшамда.</p>}
        {firstStop >= 0 && firstStop < commands.length - 1 && <p className="hw-note">Stop-тан кейінгі пәрмендер орындалмайды. Оны тізімнің соңына қой.</p>}
        <details className="al-hint"><summary>Көмекші сұрақ</summary><p>{challenge.hint}</p></details>
      </div>
    </div>
    <p className="hw-note">Мақсат — нысанаға жетіп, сол жерде Stop арқылы аяқтау. Ұяшықтың сыртындағы қадам не кедергіге кіру орындалмайды: робот соңғы жарамды орында қалады. Төмендегі бір моторлы Java мысалы бұл торлы маршрутты орындамайды.</p>
    <p className="hw-muted">Тапсырма белгілері сақталады; пәрмендер тізбегі мен жүріп жатқан анимация бетті жаңартқанда сақталмайды. Аяқталған тапсырманы қайта таңдауға болады.</p>
  </section>
}
