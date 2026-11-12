import { useEffect, useState } from 'react'
import { motorOutput, normalizePower } from './motorModel'
import type { MotorDirection } from './motorModel'

export function MotorLab({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  const [power, setPower] = useState(0.5)
  const [direction, setDirection] = useState<MotorDirection>('FORWARD')
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [notice, setNotice] = useState('Қуатты таңда да, «Іске қосу» батырмасын бас.')
  const output = motorOutput(power, direction, running)
  const rotating = output.rotation !== 'stopped'
  const rotationText = output.rotation === 'clockwise' ? '⟳ Сағат тілімен' : output.rotation === 'counterclockwise' ? '⟲ Сағат тіліне қарсы' : '○ Айналмайды'

  // Switching tabs never leaves an unseen animation running; it is not persisted.
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        setRunning(false)
        setNotice('Бет жасырылғандықтан анимация тоқтатылды. Қайта іске қосуға болады.')
      }
    }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])

  return <section className="hw-panel" aria-labelledby="ml-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">MOTOR CONTROL LAB / ОҚУ СҰЛБАСЫ</p><h2 id="ml-lab" tabIndex={-1}>Виртуалды DC Motor</h2></div><span className="hw-count">{done ? '✓ Орындалды' : 'Іске қос → тоқтат'}</span></div>
    <p>Қуат таңбасы мен бағыттың байланысын зертте. Бұл — білім беруге арналған көрнекілік, нақты FTC моторының физикалық симуляторы емес.</p>
    <div className="ml-lab-grid">
      <div className="ml-motor-stage" data-sign={output.appliedPower === 0 ? 'zero' : output.appliedPower > 0 ? 'positive' : 'negative'}>
        <div className="ml-stage-heading"><span>DC MOTOR / АЛДЫНАН КӨРІНІС</span><span className="ml-led" data-active={rotating} /></div>
        <div className="ml-motor-drawing" aria-hidden="true">
          <svg className="ml-motor-base" viewBox="0 0 320 300" fill="none">
            <path d="M85 230v27h150v-27M104 255v11m112-11v11" stroke="#4d7189" strokeWidth="8" />
            <rect x="48" y="55" width="224" height="186" rx="55" fill="#132b42" stroke="#427f96" strokeWidth="2" />
            <circle cx="160" cy="148" r="83" fill="#0a1829" stroke="#4da5b9" strokeWidth="2" />
            {[0, 60, 120, 180, 240, 300].map(angle => <g key={angle} transform={`rotate(${angle} 160 148)`}>
              <rect x="151" y="72" width="18" height="12" rx="3" fill="#294d62" />
            </g>)}
            <path d="M55 194H32v76h66m169-76h21v76h-66" stroke="#60d8e8" strokeWidth="4" />
            <rect x="100" y="253" width="120" height="35" rx="7" fill="#132c40" stroke="#42667e" />
            <text x="160" y="275" fill="#a9d7e6" textAnchor="middle" fontSize="12" fontFamily="monospace">Motor 0</text>
          </svg>
          <svg className="ml-rotor" viewBox="0 0 320 300" fill="none" style={{ animationPlayState: rotating ? 'running' : 'paused', animationDirection: output.rotation === 'counterclockwise' ? 'reverse' : 'normal' }}>
            <circle cx="160" cy="148" r="52" fill="#16374b" stroke="#63e4f4" strokeWidth="2" />
            {[0, 90, 180, 270].map(angle => <path key={angle} transform={`rotate(${angle} 160 148)`} d="M155 104h10v30h-10z" fill="#8bebf5" />)}
            <circle cx="160" cy="148" r="14" fill="#0b1d2c" stroke="#a0eff7" strokeWidth="3" />
            <circle cx="160" cy="110" r="5" fill="#fff0a4" />
          </svg>
        </div>
        <p className="ml-rotation" role="status">{rotationText}</p>
        <p className="ml-rotation-note">Бағыт шартты: бұл сұлбада FORWARD және оң қуат — ⟳. Нақты моторда қарау жағы мен қосылымға байланысты.</p>
        <p className="ml-reduced-motion">Қозғалысты азайту баптауы қосулы: айналу орнына бағыт мәтінін бақыла.</p>
      </div>
      <div className="ml-controls">
        <div className="ml-power-heading"><label htmlFor="ml-power-input">Таңдалған қуат</label><output htmlFor="ml-power-input">{power > 0 ? '+' : ''}{power.toFixed(2)}</output></div>
        <input id="ml-power-input" type="range" min={-1} max={1} step={0.05} value={power} aria-describedby="ml-power-help"
          aria-valuetext={`${power.toFixed(2)}, ${power === 0 ? 'нөлдік' : power > 0 ? 'оң' : 'теріс'} қуат`}
          onChange={event => setPower(normalizePower(Number(event.target.value)))} />
        <div className="ml-scale" aria-hidden="true"><span>−1.0</span><span>0</span><span>+1.0</span></div>
        <p id="ml-power-help" className="hw-muted">← → пернелері: 0.05 қадам. Home: −1; End: +1.</p>
        <div className="ml-signs" aria-label="Таңдалған қуаттың таңбасы">
          <span data-selected={power < 0}>− Теріс</span><span data-selected={power === 0}>○ Нөл</span><span data-selected={power > 0}>+ Оң</span>
        </div>
        <fieldset className="ml-directions"><legend>Бағыт баптауы — setDirection()</legend>
          {(['FORWARD', 'REVERSE'] as const).map(value => <label key={value}>
            <input type="radio" name="motor-direction" value={value} checked={direction === value} onChange={() => {
              setDirection(value); setRunning(false)
              setNotice('Бағыт баптауы өзгерді. Анимация тоқтатылды; қайта іске қос.')
            }} />{value} {value === 'FORWARD' ? '(негізгі)' : '(кері)'}
          </label>)}
        </fieldset>
        <div className="hw-actions">
          <button className="hw-button" type="button" disabled={running || power === 0} onClick={() => {
            setRunning(true); setHasRun(true); setNotice('Оқу анимациясы іске қосылды. Тоқтату батырмасын сына.')
          }}>Іске қосу</button>
          <button className="hw-button hw-button-secondary ml-stop" type="button" onClick={() => {
            setRunning(false); setPower(0)
            if (hasRun) { onComplete(); setHasRun(false) }
            setNotice('Тоқтатылды: motor.setPower(0). Қайта іске қосу үшін нөлден өзге қуатты таңда.')
          }}>Тоқтату · setPower(0)</button>
        </div>
        <p className="ml-applied">Қазіргі қуат пәрмені: <strong>{output.appliedPower.toFixed(2)}</strong></p>
        <pre className="ml-command" aria-label="Ағымдағы Java пәрмені"><code>{output.command}</code></pre>
        <p className="hw-muted" role="status">{notice}</p>
      </div>
    </div>
    <p className="hw-note">Анимацияның айналу қарқыны шартты әрі тұрақты; ол RPM (минуттағы айналым саны) көрсетпейді. Нақты жылдамдық мотор түріне, жүктемеге, батарея кернеуіне және басқа жағдайларға тәуелді. Stop басқанда бұл көрнекілік бірден тоқтайды; нақты білік инерциямен қозғала алады.</p>
    <p className="hw-muted">Байқап көр: FORWARD +0.5 → FORWARD −0.5 → REVERSE −0.5 → нөл. Қай жағдайда бағыт бірдей болады?</p>
  </section>
}
