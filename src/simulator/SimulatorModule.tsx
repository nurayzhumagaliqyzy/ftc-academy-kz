import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { RobotField } from './RobotField'
import { ProgramEditor } from './ProgramEditor'
import { attachPlayback } from './playback'
import { advanceAutonomous, commandForKey, commands, distanceAhead, editProgram, field, initialSimulator,
  manualCommand, pauseSimulator, resetExecution, resetField, resetRobot, startAutonomous, statusLabels,
  stepAutonomous, stopSimulator, switchMode } from './model'
import type { Command } from './model'
import '../hardware/hardware.css'
import './simulator.css'

export function SimulatorModule() {
  const [state, setState] = useState(initialSimulator)
  const [showTrail, setShowTrail] = useState(true)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const heading = useRef<HTMLHeadingElement>(null)
  const active = state.mode === 'autonomous' && state.status === 'running'
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('robot-simulator')?.scrollIntoView({ block: 'start' })
  }, [])
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (reduced) setState(pauseSimulator)
  }, [reduced])
  useEffect(() => {
    if (!active || reduced) return
    if (document.hidden) { setState(pauseSimulator); return }
    return attachPlayback(window, () => setState(advanceAutonomous), () => setState(pauseSimulator))
  }, [active, reduced])
  const robot = state.robot
  const objectText = robot.object.status === 'carried' ? 'Робот ұстап тұр' :
    (robot.object.status === 'delivered' ? 'Жеткізу аймағында босатылды' : 'Алаңда') + ' (' + robot.object.position.x + ',' + robot.object.position.y + ')'
  function manual(command: Command) { setState(previous => manualCommand(previous, command)) }
  function onKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.repeat || event.ctrlKey || event.altKey || event.metaKey || state.mode !== 'teleop') return
    const command = commandForKey(event.key)
    if (!command) return
    event.preventDefault()
    manual(command)
  }
  return <div className="hardware-module robot-simulator" id="robot-simulator">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>ROBOT SIMULATOR</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#home">← Басты бетке қайту</a>
      <p className="hw-kicker">03 / ВИРТУАЛДЫ РОБОТ ЗЕРТХАНАСЫ</p>
      <h1 ref={heading} tabIndex={-1}>Robot Simulator</h1>
      <p>Роботты қолмен жүргіз, алгоритм құрастыр, кедергіні байқап, затты жеткізіп көр. Бұл — сабақтардың бағасына әсер етпейтін еркін тәжірибе.</p>
    </div>
    <div className="rs-mode-bar"><div role="group" aria-label="Басқару режимі" className="hw-actions">
      <button type="button" className="hw-button hw-button-secondary" aria-pressed={state.mode === 'teleop'} onClick={() => setState(p => switchMode(p, 'teleop'))}>TeleOp · қолмен басқару</button>
      <button type="button" className="hw-button hw-button-secondary" aria-pressed={state.mode === 'autonomous'} onClick={() => setState(p => switchMode(p, 'autonomous'))}>Autonomous · пәрмен тізімі</button>
    </div><p>Еркін зертхана · Бағаланбайды · Сессия сақталмайды</p></div>
    <div className="rs-workspace">
      <section className="hw-panel rs-field-panel" aria-labelledby="rs-field-title">
        <div className="hw-section-head"><div><p className="hw-kicker">6 × 6 · ДЕТЕРМИНДІК ОҚУ МОДЕЛІ</p>
          <h2 id="rs-field-title">Робот алаңы</h2></div><span className="hw-count">{state.mode === 'teleop' ? 'TeleOp' : 'Autonomous'}</span></div>
        <RobotField robot={robot} showTrail={showTrail} />
        <p className="rs-legend">S — бастау (0,5) · T — мақсат (5,1) · ◆ — зат · жолақ/× — кедергі · үшбұрыш — роботтың алдыңғы жағы.</p>
        <label className="rs-trail-toggle"><input type="checkbox" checked={showTrail} onChange={e => setShowTrail(e.target.checked)} /> Жүрілген ізді көрсету (соңғы 240 орын)</label>
        <p className="rs-state-description">Робот ({robot.position.x},{robot.position.y}), бағыты {robot.direction}. Claw {robot.claw === 'open' ? 'ашық' : 'жабық'}. Зат: {objectText}.</p>
        <div className="hw-actions">
          <button type="button" className="hw-button rs-stop" onClick={() => setState(stopSimulator)}>STOP · тоқтату</button>
          <button type="button" className="hw-button hw-button-secondary" onClick={() => setState(resetRobot)}>Роботты қайтару</button>
          <button type="button" className="hw-button hw-button-secondary" onClick={() => setState(resetField)}>Алаңды қалпына келтіру</button>
        </div>
        <p className="hw-muted rs-reset-note">Роботты қайтару: робот/із/санағыш нөлденеді, зат орнында қалады (тасылған зат сол ұяшыққа түсіріледі, жеткізу саналмайды). Алаңды қалпына келтіру затты да бастапқыға қайтарады. Екеуі де орындауды тоқтатып, тізімді сақтайды.</p>
      </section>
      <div className="rs-control-column">
        {state.mode === 'teleop' ? <section className="hw-panel rs-manual" aria-labelledby="rs-teleop-title">
          <p className="hw-kicker">TELEOP / БІР БАСУ — БІР ҚАДАМ</p><h2 id="rs-teleop-title">Қолмен басқару</h2>
          <div className="rs-keypad" tabIndex={0} role="group" aria-label="Пернетақтамен басқару алаңы" aria-describedby="rs-key-help" onKeyDown={onKeys}>
            <strong>Пернетақта фокусын осында қой</strong><p id="rs-key-help">Tab арқылы таңда: ↑/W — алға, ↓/S — артқа, ←/A — солға, →/D — оңға. O — ашу, C — жабу, Space — Stop. Басып ұстау қайталанбайды.</p>
          </div>
          <div className="rs-drive-pad">
            <button type="button" className="hw-button hw-button-secondary rs-forward" onClick={() => manual('forward')}>↑ Алға</button>
            <button type="button" className="hw-button hw-button-secondary rs-left" onClick={() => manual('left')}>↶ Солға</button>
            <button type="button" className="hw-button rs-pad-stop" onClick={() => manual('stop')}>Stop</button>
            <button type="button" className="hw-button hw-button-secondary rs-right" onClick={() => manual('right')}>Оңға ↷</button>
            <button type="button" className="hw-button hw-button-secondary rs-backward" onClick={() => manual('backward')}>↓ Артқа</button>
          </div>
          <div className="rs-claw-controls">
            <button type="button" className="hw-button hw-button-secondary" onClick={() => manual('open')}>Open Claw · ашу</button>
            <button type="button" className="hw-button hw-button-secondary" onClick={() => manual('close')}>Close Claw · жабу</button>
            <button type="button" className="hw-button hw-button-secondary" onClick={() => manual('read')}>Read Distance · оқу</button>
          </div>
          <p className="hw-muted">Тек фокусталған пернетақта алаңы роботты басқарады. Батырма, мәтін өрісі немесе басқа бөлімдегі WASD/arrow пернелері қозғалыс бермейді.</p>
        </section> : <ProgramEditor state={state} reduced={reduced}
          onEdit={edit => setState(p => editProgram(p, edit))} onRun={() => setState(startAutonomous)}
          onPause={() => setState(pauseSimulator)} onStep={() => setState(stepAutonomous)} onReset={() => setState(resetExecution)} />}
        <section className="hw-panel rs-telemetry" aria-labelledby="rs-telemetry-title">
          <div className="hw-section-head"><h2 id="rs-telemetry-title">Telemetry <small>(ағымдағы күй)</small></h2><span className="hw-count">{statusLabels[state.status]}</span></div>
          <dl className="rs-values">
            <div><dt>Координата (x, y)</dt><dd>({robot.position.x},{robot.position.y})</dd></div>
            <div><dt>Бағыт</dt><dd>{robot.direction} · {({ N: 'Солтүстік ↑', E: 'Шығыс →', S: 'Оңтүстік ↓', W: 'Батыс ←' })[robot.direction]}</dd></div>
            <div><dt>Distance Sensor · live</dt><dd>{distanceAhead(robot)} бос ұяшық</dd></div>
            <div><dt>Claw / Servo күйі</dt><dd>{robot.claw === 'open' ? 'Ашық' : 'Жабық'}</dd></div>
            <div><dt>Зат күйі</dt><dd>{objectText}</dd></div>
            <div><dt>Сәтті қозғалыстар</dt><dd>{robot.moves} қадам</dd></div>
            <div><dt>Шартты Encoder</dt><dd>{robot.ticks > 0 ? '+' : ''}{robot.ticks} tick</dd></div>
            <div><dt>Соңғы пәрмен</dt><dd>{state.lastCommand ? commands[state.lastCommand] : 'Әлі жоқ'}</dd></div>
          </dl>
          {robot.observation && <p className="hw-muted">Соңғы Read/IF: ({robot.observation.position.x},{robot.observation.position.y}) {robot.observation.direction}, {robot.observation.cells} бос ұяшық. Кейінгі қозғалыстан соң бұл бақылау ескіруі мүмкін.</p>}
          <div className="hw-feedback" role="status" aria-live="polite" data-kind={state.status === 'blocked' || state.status === 'error' ? 'bad' : robot.object.status === 'delivered' ? 'good' : undefined}>
            <strong>{statusLabels[state.status]}</strong><p>{state.message}</p>
          </div>
        </section>
      </div>
    </div>
    <section className="hw-panel rs-guide" aria-labelledby="rs-guide-title">
      <p className="hw-kicker">ҚОЛДАНУ НҰСҚАУЛЫҒЫ</p><h2 id="rs-guide-title">Болжап көр → орында → салыстыр</h2>
      <ol className="hw-list">
        <li>Роботты жүргізіп, x пен y қалай өзгеретінін бақыла. Бұрылыс пен артқа жүруді салыстыр.</li>
        <li>Кедергіге жақында: live өлшемін оқып, басқа бағыт таңда. Autonomous-та Read Distance және IF-OBSTACLE сына.</li>
        <li>Open Claw → зат тұрған (2,5) ұяшыққа кел → Close Claw. Оны T (5,1) аймағына апарып Open Claw арқылы босат.</li>
      </ol>
      <p>Бұлар — ерікті зерттеу ұсыныстары. Мұнда ұпай, міндетті миссия немесе Programming сабағын аяқтау белгісі жоқ.</p>
      <details className="rs-help"><summary>Құрылғылар мен режимдер нені білдіреді?</summary><dl className="hw-facts">
        <div><dt>TeleOp (оператор басқаратын режим)</dt><dd>Оператор әр қадамды өзі береді. Мұнда батырма немесе фокусталған пернетақта алаңы қолданылады.</dd></div>
        <div><dt>Autonomous (алдын ала берілген алгоритм)</dt><dd>Робот дайын тізімді ретімен орындайды. Бұл Java интерпретаторы емес.</dd></div>
        <div><dt>DC Motor (қозғалтқыш)</dt><dd>Қозғалыс пәрмені модельде бір ұяшыққа ауысады. Бұрылыс тек төрт бағыттың бірін таңдайды.</dd></div>
        <div><dt>Servo Motor / Claw (серво арқылы қысқыш)</dt><dd>Ашу/жабу — айқын күйлер. Затты тек бір ұяшықта ашық күйден жабу жинайды. Нақты Servo позициясы механизмге тәуелді.</dd></div>
        <div><dt>Distance Sensor (қашықтық датчигі)</dt><dd>Қазіргі алдыңғы бағыттағы келесі кедергі/шекараға дейінгі бос ұяшықтар саны. Зат кедергі саналмайды; артқа қарамайды. Модель артқы соқтығысты да геометриямен бұғаттайды.</dd></div>
        <div><dt>Encoder (айналым есебі)</dt><dd>Алға +100, артқа −100 шартты tick; бұрылысқа 0. Бұл нақты мотор сигналы, RPM немесе әмбебап counts-per-distance емес.</dd></div>
        <div><dt>Telemetry (күйді көрсету)</dt><dd>Орын, бағыт, Claw, зат, Sensor және орындау күйін салыстыр. Координатаға жету заттың жеткізілгенін білдірмейді.</dd></div>
      </dl></details>
      <details className="rs-help"><summary>Reset, режим ауыстыру және шектеулер</summary>
        <p>Режим ауысқанда робот/зат/із сақталады, орындау тоқтап тізім басына қайтады. Тізімді өңдеу де орындауды басына қояды, бірақ роботты жылжытпайды. «Орындауды басына» тек орындау индексін тазартады. Stop-тан кейін қайта Run үшін осы батырманы қолдан.</p>
        <p>Басқа бетке кеткенде орындау жойылады. Қайта ашқанда алаң, режим және тізім жаңа сессиядан басталады; localStorage-қа жазылмайды. Tab жасырылса немесе терезе фокусын жоғалтса, автоматты орындау кідіреді.</p>
        <p>Бұл — тордағы детерминдік оқу моделі. Бір ұяшықтың тұрақты физикалық қашықтығы жоқ. Инерция, сырғанау, жүк, батарея, Sensor шуы және нақты drivetrain есептелмейді. STOP модельді дереу тоқтатады; нақты робот инерциямен қозғала алады. Веб-бет FTC Java кодын орындамайды және физикалық роботқа қосылмайды.</p>
      </details>
      <p className="hw-muted">Алаң {field.width}×{field.height}; x — оңға, y — төмен. Әр әрекет бір дискрет қадам. Playback аралығы 650 ms — тек оқу қарқыны, физикалық уақыт емес.</p>
    </section>
  </div>
}
