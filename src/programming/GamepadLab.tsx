import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { gamepadOutput, joystickFromPointer, normalizeJoystick } from './gamepadModel'

export function GamepadLab({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  const [y, setY] = useState(0)
  const visited = useRef({ forward: false, backward: false })
  const pointer = useRef<number | null>(null)
  const output = gamepadOutput(y)
  function change(value: number) {
    const next = normalizeJoystick(value)
    if (next < 0) visited.current.forward = true
    if (next > 0) visited.current.backward = true
    setY(next)
  }
  function reset() {
    setY(0)
    pointer.current = null
    if (visited.current.forward && visited.current.backward && !done) onComplete()
  }
  useEffect(() => {
    const stop = () => { setY(0); pointer.current = null }
    const hide = () => { if (document.hidden) stop() }
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', hide)
    return () => { window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', hide) }
  }, [])
  function move(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    change(joystickFromPointer(event.clientY, rect.top, rect.height))
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape', ' '].includes(event.key)) return
    event.preventDefault()
    if (event.key === 'ArrowUp') change(y - 0.1)
    else if (event.key === 'ArrowDown') change(y + 0.1)
    else if (event.key === 'Home') change(-1)
    else if (event.key === 'End') change(1)
    else reset()
  }
  const direction = output.rotation === 'stopped' ? '○ Тоқтап тұр' : output.power > 0 ? '⟳ Негізгі бағыт' : '⟲ Кері бағыт'
  return <section className="hw-panel gl-lab" aria-labelledby="gl-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">GAMEPAD LAB / ОҚУ МОДЕЛІ</p><h2 id="gl-lab" tabIndex={-1}>Тетіктен моторға дейін</h2></div><span className="hw-count">{done ? '✓ Орындалды' : 'Алға → артқа → нөл'}</span></div>
    <p>Бұл — білім беруге арналған көрнекі модель. Нақты FTC құрылғысына қосылмайды және мотордың физикасын есептемейді.</p>
    <div className="gl-lab-grid">
      <div className="gl-controller">
        <p className="hw-kicker">GAMEPAD 1 · LEFT STICK</p>
        <div className="gl-controller-body">
          <div className="gl-stick-labels" aria-hidden="true"><span>АЛҒА · Y = −1</span><span>АРТҚА · Y = +1</span></div>
          <div className="gl-stick" role="slider" tabIndex={0} aria-label="Сол Joystick Y мәні"
            aria-orientation="vertical" aria-valuemin={-1} aria-valuemax={1} aria-valuenow={output.y}
            aria-valuetext={`${output.y.toFixed(2)}; мотор қуаты ${output.power.toFixed(2)}`}
            aria-describedby="gl-controls-help" onKeyDown={key} onBlur={reset}
            onPointerDown={event => {
              if (!event.isPrimary || event.button !== 0) return
              event.preventDefault(); event.currentTarget.focus(); pointer.current = event.pointerId
              event.currentTarget.setPointerCapture(event.pointerId); move(event)
            }}
            onPointerMove={event => { if (pointer.current === event.pointerId) move(event) }}
            onPointerUp={event => { if (pointer.current === event.pointerId) { reset(); event.currentTarget.releasePointerCapture(event.pointerId) } }}
            onPointerCancel={reset} onLostPointerCapture={reset}>
            <span className="gl-axis" aria-hidden="true" />
            <span className="gl-stick-knob" aria-hidden="true" style={{ transform: `translate(-50%, calc(-50% + ${output.y * 58}px))` }}>Y</span>
          </div>
          <div className="gl-face-buttons" aria-hidden="true"><span>Y</span><span>X</span><span>B</span><span>A</span></div>
        </div>
        <div className="gl-controls">
          <button type="button" className="hw-button hw-button-secondary" onClick={() => change(-0.5)}>↑ Алға · Y −0.50</button>
          <button type="button" className="hw-button hw-button-secondary" onClick={() => change(0.5)}>↓ Артқа · Y +0.50</button>
          <button type="button" className="hw-button" onClick={reset}>Нөлге қайтару</button>
        </div>
        <p id="gl-controls-help" className="hw-muted">Тетікті тінтуірмен не саусақпен жоғары-төмен сүйре: жібергенде ортаға қайтады. Пернетақта: Tab арқылы тетікті таңда; ↑ Y-ті 0.10-ға азайтады, ↓ арттырады; Home −1, End +1, Space немесе Esc — нөл. Батырмалар мен пернелер қойған мән нөлге қайтарғанша сақталады; тетіктен фокус кеткенде нөлденеді.</p>
      </div>
      <div className="gl-output">
        <div className="gl-values"><div><span>left_stick_y</span><output>{output.y.toFixed(2)}</output></div><div><span>power = −Y</span><output>{output.power > 0 ? '+' : ''}{output.power.toFixed(2)}</output></div></div>
        <div className="gl-power-display" data-sign={output.power === 0 ? 'zero' : output.power > 0 ? 'positive' : 'negative'}>
          <p id="gl-power-label">Мотор қуаты · {output.power === 0 ? 'нөл' : output.power > 0 ? 'оң' : 'теріс'}</p>
          <div id="gl-power-meter" className="gl-power-track" role="meter" aria-labelledby="gl-power-label" aria-valuemin={-1} aria-valuemax={1} aria-valuenow={output.power}>
            <span className="gl-power-fill" style={{ left: `${output.power < 0 ? (output.power + 1) * 50 : 50}%`, width: `${Math.abs(output.power) * 50}%` }} />
            <span className="gl-power-center" />
          </div>
          <div className="gl-scale"><span>−1.0</span><span>0</span><span>+1.0</span></div>
        </div>
        <div className="gl-motor" data-rotation={output.rotation}>
          <svg viewBox="0 0 160 160" role="img" aria-label={`Мотордың шартты көрінісі: ${direction}`}>
            <circle cx="80" cy="80" r="69" className="gl-motor-ring" />
            <g className="gl-rotor"><path d="M80 30 L92 68 L130 80 L92 92 L80 130 L68 92 L30 80 L68 68 Z" /><circle cx="80" cy="80" r="16" /></g>
          </svg>
          <strong>{direction}</strong>
        </div>
        <p className="gl-motion-note hw-muted">Қозғалысты азайту баптауы қосылса, анимация көрсетілмейді; бағытты мәтіннен оқы.</p>
        <pre className="gl-live-code" tabIndex={0} aria-label="Ағымдағы Java коды"><code lang="en">{output.command}{'\n\n'}{`// left_stick_y = ${output.y.toFixed(2)}\n// power = ${output.power.toFixed(2)}\n// motor.setPower(${output.power.toFixed(2)});`}</code></pre>
        <p className="hw-muted">Сандық нәтиже: −({output.y.toFixed(2)}) = {output.power.toFixed(2)}. Java жолдары өзгермейді, кіріс пен есептелген мән жаңарады.</p>
      </div>
    </div>
    <p className="hw-note">Бұл сұлбада FORWARD және оң қуат шартты түрде ⟳ бағытымен көрсетіледі. Нақты айналу бағыты моторға, қосылымға және қарау жағына тәуелді. Анимация қарқыны тұрақты, RPM (минуттағы айналым саны) емес; нақты жылдамдық жүктемеге, батареяға және моторға байланысты.</p>
    <p role="status">{done ? '✓ Алға, артқа және нөл мәндерін зерттедің.' : 'Тапсырма: теріс Y пен оң Y мәндерін байқап көр, содан кейін «Нөлге қайтару» батырмасын бас.'}</p>
  </section>
}
