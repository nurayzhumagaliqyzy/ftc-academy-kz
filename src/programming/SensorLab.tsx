import { useState } from 'react'
import {
  evaluateSensorChallenge, normalizeLabDistance, normalizeStopThreshold, obstacleOutput,
  sensorChallenges, sensorLabCode,
} from './sensorModel'
import type { SensorChallengeId } from './sensorModel'

export function SensorLab({ solved, onSolve, onRetry }: {
  solved: readonly SensorChallengeId[]; onSolve: (id: SensorChallengeId) => void; onRetry: () => void
}) {
  const [distance, setDistance] = useState(40)
  const [threshold, setThreshold] = useState(20)
  const [invalid, setInvalid] = useState(false)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [action, setAction] = useState('')
  const [explanation, setExplanation] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>()
  const challenge = sensorChallenges[challengeIndex]
  const reading = invalid ? NaN : distance
  const output = obstacleOutput(reading, threshold)
  const obstacleX = 150 + distance * 3
  function clearAttempt() { setAction(''); setExplanation(''); setFeedback(undefined) }
  function reset() { setDistance(40); setThreshold(20); setInvalid(false); clearAttempt() }
  return <section className="hw-panel sn-lab" aria-labelledby="sn-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">ОҚЫ → ТЕКСЕР → САЛЫСТЫР → ПӘРМЕН БЕР</p><h2 id="sn-lab" tabIndex={-1}>Obstacle Detection Lab (кедергіні анықтау зертханасы)</h2></div><span className="hw-count">{solved.length}/3 орындалды</span></div>
    <p>Қашықтық пен шекті өзгерт. Алдымен шарттың нәтижесін болжа, кейін сандық көрсеткішпен және Java кодымен салыстыр. Тапсырмада кіріс мәндері, мотор пәрмені және түсіндірме бірге дұрыс болуы керек.</p>
    <p className="hw-note">Бұл — физикалық динамикасыз детерминдік оқу моделі. Роботтың суреті қозғалмайды; кедергіні слайдер қолмен жылжытады. setPower(0) — нөлдік қуат пәрмені, нақты роботтың лезде тоқтауы емес.</p>
    <div className="sn-lab-grid">
      <div className="sn-visual" data-state={output.reason}>
        <svg viewBox="0 0 500 220" role="img" aria-label={`Шартты робот, датчик және кедергі; көрсеткіш ${invalid ? 'NaN' : distance + ' см'}, шек ${threshold} см`}>
          <defs><pattern id="sn-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0 H0 V25" fill="none" stroke="currentColor" opacity=".12" /></pattern></defs>
          <rect width="500" height="220" fill="url(#sn-grid)" />
          <rect x="42" y="58" width="26" height="20" rx="4" className="sn-wheel" /><rect x="98" y="58" width="26" height="20" rx="4" className="sn-wheel" />
          <rect x="42" y="142" width="26" height="20" rx="4" className="sn-wheel" /><rect x="98" y="142" width="26" height="20" rx="4" className="sn-wheel" />
          <rect x="32" y="77" width="104" height="66" rx="12" className="sn-robot" /><text x="84" y="115" textAnchor="middle">Робот</text>
          <rect x="128" y="96" width="22" height="28" rx="4" className="sn-sensor" />
          <line x1="150" y1="110" x2={obstacleX} y2="110" className="sn-ray" />
          <line x1={150 + threshold * 3} y1="35" x2={150 + threshold * 3} y2="175" className="sn-threshold" />
          <rect x={obstacleX} y="65" width="25" height="90" rx="4" className="sn-obstacle" />
          <text x="250" y="200" textAnchor="middle">Көрсеткіш: {invalid ? 'NaN · қашықтық белгісіз' : distance + ' см'} · шек: {threshold} см</text>
        </svg>
        <p className="hw-muted">Cyan блок — Sensor; қызғылт блок — кедергі; үзік сызық — шек.</p>
        {invalid && <p className="hw-muted">NaN кезінде кедергі суреті соңғы слайдер мәнінде қалады. Бұл сурет нақты қашықтықты растамайды.</p>}
        <div className="sn-command" role="status"><b>Мотор пәрмені: <code>setPower({output.power})</code></b><span>{output.power === 0 ? 'Нөлдік жетек қуаты' : '0.3 қуатқа рұқсат · өлшенген жылдамдық емес'}</span></div>
      </div>
      <div className="hw-detail sn-controls">
        <label className="pl-match-label" htmlFor="sn-distance">Өлшенген қашықтық: <output htmlFor="sn-distance">{invalid ? 'NaN' : distance + ' см'}</output></label>
        <input id="sn-distance" type="range" min="5" max="100" step="1" value={distance} disabled={invalid} aria-valuetext={distance + ' сантиметр'} onChange={event => { setDistance(normalizeLabDistance(Number(event.target.value))); setFeedback(undefined) }} />
        <p className="hw-muted">Оқу слайдері: 5–100 см, қадам 1 см. Бұл нақты датчик дәлдігінің не толық диапазонының сипаттамасы емес.</p>
        <label className="pl-match-label" htmlFor="sn-threshold">Тоқтату шегі: <output htmlFor="sn-threshold">{threshold} см</output></label>
        <input id="sn-threshold" type="range" min="5" max="50" step="1" value={threshold} aria-valuetext={threshold + ' сантиметр'} onChange={event => { setThreshold(normalizeStopThreshold(Number(event.target.value))); setFeedback(undefined) }} />
        <label className="sn-invalid"><input type="checkbox" checked={invalid} onChange={event => { setInvalid(event.target.checked); setFeedback(undefined) }} />NaN көрсету (жарамсыз өлшем)</label>
        <p className="hw-muted">Слайдерлер: сүйреу немесе ←/→. Home/End — аралық шеттері; NaN режимі сандық қашықтық слайдерін бұғаттайды.</p>
        <button type="button" className="hw-button hw-button-secondary" onClick={reset}>Lab көрінісін бастапқыға қайтару</button>
      </div>
    </div>
    <p className="hw-note" aria-live="polite">{output.message}</p>
    <figure className="pl-code-figure"><figcaption>Шекке сай жаңаратын Java · ағымдағы көрсеткіш: {invalid ? 'NaN' : distance + ' см'}</figcaption><pre tabIndex={0} aria-label="Жаңаратын қашықтық шарты"><code lang="en">{sensorLabCode(threshold)}</code></pre></figure>
    <div className="sn-challenges" role="group" aria-label="Sensor Lab тапсырмалары">{sensorChallenges.map((item, index) => <button type="button" className="hw-button hw-button-secondary" key={item.id} aria-pressed={index === challengeIndex} onClick={() => { setChallengeIndex(index); clearAttempt() }}>{solved.includes(item.id) ? '✓ ' : ''}{item.title}</button>)}</div>
    <fieldset className="hw-question sn-task"><legend>{challenge.title}</legend><p>{challenge.prompt}</p>
      <button type="button" className="hw-button hw-button-secondary" onClick={() => { setDistance(challenge.distance); setThreshold(challenge.threshold); setInvalid(challenge.invalid); clearAttempt() }}>Тапсырма мәндерін қою</button>
      <label className="pl-match-label" htmlFor="sn-action">Моторға қандай пәрмен бересің?</label>
      <select id="sn-action" value={action} onChange={event => { setAction(event.target.value); setFeedback(undefined) }}><option value="">Пәрменді таңда…</option><option value="permit">motor.setPower(0.3);</option><option value="stop">motor.setPower(0);</option><option value="reverse">motor.setPower(-0.3);</option></select>
      <label className="pl-match-label" htmlFor="sn-explanation">Себебін түсіндір</label>
      <select id="sn-explanation" value={explanation} onChange={event => { setExplanation(event.target.value); setFeedback(undefined) }}><option value="">Түсіндірмені таңда…</option>{challenge.explanations.map((option, index) => <option key={option} value={index}>{option}</option>)}</select>
      {explanation !== '' && <p className="hw-muted">Таңдаған түсіндірмең: {challenge.explanations[Number(explanation)]}</p>}
      <button type="button" className="hw-button" disabled={action === '' || explanation === ''} onClick={() => { const result = evaluateSensorChallenge(challenge.id, reading, threshold, action, Number(explanation)); setFeedback(result); if (result.correct) onSolve(challenge.id) }}>Пәрмен мен түсіндірмені тексеру</button>
      <div aria-live="polite" aria-atomic="true">{feedback && <p className="hw-feedback" data-kind={feedback.correct ? 'good' : 'bad'}>{feedback.message}</p>}</div>
    </fieldset>
    <button type="button" className="hw-button hw-button-secondary" onClick={() => { onRetry(); setChallengeIndex(0); reset() }}>Lab-ты қайта орындау</button>
    <p className="hw-muted">Көріністі бастапқыға қайтару: 40 см, шек 20 см, NaN өшірулі; жинаған дәлелдер сақталады. Lab-ты қайта орындау тек үш Lab нәтижесі мен аяқтау белгісін тазартады. Теория, Java, тест пен жағдаят сақталады. Слайдерлер мен ағымдағы жауап таңдауы сақталмайды.</p>
  </section>
}
