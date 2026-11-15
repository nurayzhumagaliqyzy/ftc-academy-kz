import { useState } from 'react'
import { evaluateServoChallenge, normalizeServoPosition, servoChallenges, servoClawOutput } from './servoModel'
import type { ServoChallengeId } from './servoModel'

export function ServoLab({ solved, onSolve, onRetry }: {
  solved: readonly ServoChallengeId[]; onSolve: (id: ServoChallengeId) => void; onRetry: () => void
}) {
  const [position, setPosition] = useState(0.5)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>()
  const output = servoClawOutput(position)
  const challenge = servoChallenges[challengeIndex]
  function move(value: number) { setPosition(normalizeServoPosition(value)); setFeedback(undefined) }
  function reset() { setPosition(0.5); setAnswer(''); setFeedback(undefined) }
  return <section className="hw-panel sl-lab" aria-labelledby="sl-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">БОЛЖА → БАПТА → ТҮСІНДІР</p><h2 id="sl-lab" tabIndex={-1}>Servo Claw Lab (қысқыш зертханасы)</h2></div><span className="hw-count">{solved.length}/3 орындалды</span></div>
    <p>Слайдермен позицияны өзгерт, екі жақтың шартты ашылуын бақыла, содан кейін тапсырмадағы түсіндірмені таңда. Позиция мен түсіндірме бірге дұрыс болғанда ғана тапсырма есептеледі.</p>
    <p className="hw-note">Бұл — механикалық физиканы есептемейтін оқу моделі. Тек осы суретте 0.00 — тар, 1.00 — кең ашылу. Нақты Servo-да ашық/жабық мәндер мен жүріс аралығы модельге, конфигурацияға және орнатылуына тәуелді.</p>
    <div className="sl-lab-grid">
      <div className="sl-visual">
        <svg viewBox="0 0 320 250" role="img" aria-label={`Шартты екі жақты қысқыш, нысаналы позиция ${output.position.toFixed(2)}`}>
          <defs><pattern id="sl-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" opacity="0.12" /></pattern></defs>
          <rect width="320" height="250" fill="url(#sl-grid)" />
          <rect x="116" y="20" width="88" height="54" rx="12" className="sl-servo-body" />
          <text x="160" y="52" textAnchor="middle">Servo</text>
          <path d="M 138 78 L 182 78" className="sl-linkage" />
          <g className="sl-jaw" style={{ transform: `rotate(${output.jawSpread}deg)`, transformOrigin: '138px 85px' }}><path d="M 138 85 L 112 162 L 128 198" /></g>
          <g className="sl-jaw" style={{ transform: `rotate(${-output.jawSpread}deg)`, transformOrigin: '182px 85px' }}><path d="M 182 85 L 208 162 L 192 198" /></g>
          <circle cx="138" cy="85" r="7" className="sl-pivot" /><circle cx="182" cy="85" r="7" className="sl-pivot" />
          <text x="160" y="237" textAnchor="middle">Шартты ашылу · физикалық бұрыш емес</text>
        </svg>
        <p className="sl-position">Нысаналы позиция: <output htmlFor="sl-position">{output.position.toFixed(2)}</output></p>
      </div>
      <div className="hw-detail sl-controls">
        <label className="pl-match-label" htmlFor="sl-position">Позиция · 0.00…1.00</label>
        <input id="sl-position" type="range" min="0" max="1" step="0.01" value={output.position} aria-valuetext={output.position.toFixed(2)} onChange={event => move(Number(event.target.value))} />
        <div className="sl-scale" aria-hidden="true"><span>0.00 · тар</span><span>0.50</span><span>1.00 · кең</span></div>
        <p className="hw-muted">Слайдерді сүйре немесе пернетақтадағы ←/→ арқылы 0.01 қадаммен өзгерт. Home — 0.00, End — 1.00.</p>
        <pre className="pl-exercise-code" aria-label="Жаңаратын Java пәрмені"><code lang="en">{output.command}</code></pre>
        <button type="button" className="hw-button hw-button-secondary" onClick={reset}>Позицияны 0.50-ге қайтару</button>
        <p className="hw-muted">Бұл батырма жинаған нәтижені сақтайды. Позицияны қайтару нақты Servo-ның қорегін өшірмейді.</p>
      </div>
    </div>
    <div className="sl-challenges" role="group" aria-label="Claw Lab тапсырмасын таңдау">
      {servoChallenges.map((item, index) => <button type="button" className="hw-button hw-button-secondary" key={item.id} aria-pressed={index === challengeIndex} onClick={() => { setChallengeIndex(index); reset() }}>{solved.includes(item.id) ? '✓ ' : ''}{item.title}</button>)}
    </div>
    <fieldset className="hw-question sl-task"><legend>{challenge.title}</legend><p>{challenge.prompt}</p>
      <label className="pl-match-label" htmlFor="sl-explanation">Себебін түсіндір</label>
      <select id="sl-explanation" value={answer} onChange={event => { setAnswer(event.target.value); setFeedback(undefined) }}><option value="">Түсіндірмені таңда…</option>{challenge.options.map((option, index) => <option key={option} value={index}>{option}</option>)}</select>
      {answer !== '' && <p className="hw-muted">Таңдаған түсіндірмең: {challenge.options[Number(answer)]}</p>}
      <button type="button" className="hw-button" disabled={answer === ''} onClick={() => {
        const result = evaluateServoChallenge(challenge.id, position, Number(answer))
        setFeedback(result)
        if (result.correct) onSolve(challenge.id)
      }}>Позиция мен түсіндірмені тексеру</button>
      <div aria-live="polite" aria-atomic="true">{feedback && <p className="hw-feedback" data-kind={feedback.correct ? 'good' : 'bad'}>{feedback.message}</p>}</div>
    </fieldset>
    <button type="button" className="hw-button hw-button-secondary" onClick={() => { onRetry(); setChallengeIndex(0); reset() }}>Lab-ты қайта орындау</button>
    <p className="hw-muted">Қайта орындау тек осы Lab-тың үш нәтижесі мен сабақтың аяқтау белгісін тазартады. Теория, Java, тест пен жағдаят сақталады. Слайдердің ағымдағы мәні сақталмайды.</p>
  </section>
}
