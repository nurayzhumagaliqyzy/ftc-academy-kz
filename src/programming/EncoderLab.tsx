import { useEffect, useState } from 'react'
import {
  advanceEncoder, encoderAngle, encoderChallenges, encoderCurrent, encoderDirection, encoderLabCode,
  encoderRemaining, evaluateEncoderChallenge, initialEncoderState, parseTickInput, pauseEncoder,
  resetEncoderReference, setEncoderTarget, startEncoder, stepEncoder, ticksPerStep,
} from './encoderModel'
import type { EncoderChallengeId } from './encoderModel'

const signed = (value: number) => value > 0 ? '+' + value : String(value)
export function EncoderLab({ solved, onSolve, onRetry }: {
  solved: readonly EncoderChallengeId[]; onSolve: (id: EncoderChallengeId) => void; onRetry: () => void
}) {
  const [state, setState] = useState(() => initialEncoderState())
  const [targetText, setTargetText] = useState('800')
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [difference, setDifference] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>()
  const [inputError, setInputError] = useState('')
  const challenge = encoderChallenges[challengeIndex]
  const current = encoderCurrent(state)
  const remaining = encoderRemaining(state)
  const running = state.status === 'running'
  const direction = encoderDirection(state)
  useEffect(() => {
    if (!running) return
    // Display pacing only. State advances by fixed ticks, never elapsed time or RPM.
    const timer = window.setInterval(() => setState(previous => advanceEncoder(previous)), 400)
    return () => window.clearInterval(timer)
  }, [running])
  useEffect(() => {
    const pauseHidden = () => { if (document.hidden) setState(previous => pauseEncoder(previous)) }
    document.addEventListener('visibilitychange', pauseHidden)
    return () => document.removeEventListener('visibilitychange', pauseHidden)
  }, [])
  function clearAttempt() { setDifference(''); setAnswer(''); setFeedback(undefined); setInputError('') }
  function resetModel() { setState(initialEncoderState()); setTargetText('800'); setChallengeIndex(0); clearAttempt() }
  return <section className="hw-panel en-lab" aria-labelledby="en-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">БОЛЖА → ҚАДАМДА → САНАҚТЫ ТҮСІНДІР</p><h2 id="en-lab" tabIndex={-1}>Encoder Position Lab (нысаналы позиция зертханасы)</h2></div><span className="hw-count">{solved.length}/3 орындалды</span></div>
    <p>Нысана − ағымдағы есеп айырмасын болжа. Нысананы орнатып, автоматты қадаммен не бір қадамнан орында. Нөлдеуден бұрын және кейін біліктің суретін салыстыр.</p>
    <p className="hw-note">Бұл — нақты FTC мотор физикасы емес, детерминдік оқу моделі. Әр қадам {ticksPerStep} tick, соңғы қадам қалдыққа дейін қысқарады. Көрсету аралығы есептеуге қатыспайды; elapsed time (өткен уақыт), RPM (минуттағы айналым саны), инерция және нақты isBusy() есептелмейді. Lab дәл нысанада тоқтайды; нақты аппаратта tolerance пен overshoot бар.</p>
    <div className="en-lab-grid">
      <div className="en-visual">
        <svg viewBox="0 0 420 240" role="img" aria-label={`Мотор және Encoder; ағымдағы есеп ${current}, нысана ${state.target}, қалдық ${remaining} tick. Білік белгісі нөлдеуден қозғалмайды.`}>
          <rect x="30" y="80" width="160" height="90" rx="18" className="en-motor" /><text x="110" y="122" textAnchor="middle">DC Motor</text><text x="110" y="144" textAnchor="middle">Encoder</text>
          <path d="M 190 125 H 246" className="en-shaft" /><circle cx="292" cy="125" r="62" className="en-disc" />
          <g className="en-marker" style={{ transform: `rotate(${encoderAngle(state)}deg)`, transformOrigin: '292px 125px' }}><path d="M292 125 L292 72" /><circle cx="292" cy="72" r="7" /></g>
          <circle cx="292" cy="125" r="9" className="en-center" />
          <text x="210" y="214" textAnchor="middle">Осы сурет: 560 tick / шығыс айналымы</text>
        </svg>
        <p className="hw-muted">Дөңгелек белгі — модельдегі шығыс білігі. Reset сурет бағытын өзгертпейді; бұрыш масштабы тек 560 tick/айналым мысалына тән.</p>
        <dl className="en-values"><div><dt>Ағымдағы есеп</dt><dd>{signed(current)} tick</dd></div><div><dt>Target (нысана)</dt><dd>{signed(state.target)} tick</dd></div><div><dt>Қалған айырма</dt><dd>{signed(remaining)} tick</dd></div><div><dt>Орындалған қадам</dt><dd>{state.steps}</dd></div></dl>
        <p className="hw-muted">Lab-тың өзгермейтін бастапқы координатасындағы білік: {signed(state.shaftTicks)} tick. Соңғы нөлдік есеп басы: {signed(state.zeroOffset)} tick. Бұл нақты роботтың абсолют орны емес.</p>
      </div>
      <div className="hw-detail en-controls">
        <label className="pl-match-label" htmlFor="en-target">Жаңа target · −2000…+2000 tick</label>
        <input id="en-target" type="number" min="-2000" max="2000" step="1" value={targetText} disabled={running} onChange={event => { setTargetText(event.target.value); setInputError(''); setFeedback(undefined) }} aria-describedby="en-target-help" />
        <p id="en-target-help" className="hw-muted">Тек бүтін сан. Өрістегі жаңа мән «Нысананы орнату» басылғанда ғана қолданылады; ағымдағы target сол жақта көрсетілген.</p>
        <button type="button" className="hw-button hw-button-secondary" disabled={running} onClick={() => {
          const target = parseTickInput(targetText)
          if (target === undefined) { setInputError('−2000…+2000 аралығындағы бүтін tick санын енгіз.'); return }
          setState(previous => setEncoderTarget(previous, target)); setFeedback(undefined); setInputError('')
        }}>Нысананы орнату</button>
        {inputError && <p className="hw-feedback" data-kind="bad" role="alert">{inputError}</p>}
        <div className="en-buttons"><button type="button" className="hw-button" disabled={running || remaining === 0} onClick={() => setState(previous => startEncoder(previous))}>{state.status === 'paused' ? 'Жалғастыру' : 'Бастау'}</button><button type="button" className="hw-button hw-button-secondary" disabled={!running} onClick={() => setState(previous => pauseEncoder(previous))}>Кідірту</button><button type="button" className="hw-button hw-button-secondary" disabled={running || remaining === 0} onClick={() => setState(previous => stepEncoder(previous))}>Бір қадам</button></div>
        <button type="button" className="hw-button hw-button-secondary" disabled={running} onClick={() => { setState(previous => resetEncoderReference(previous)); setTargetText('0'); clearAttempt() }}>Encoder есебін нөлдеу</button>
        <p className="hw-muted">Алдымен кідірт. Нөлдеу кезінде білік орнында қалады; осы Lab ескі target-ті де 0-ге қояды. Жаңа салыстырмалы target-ті өзің енгіз. Бұл SDK-ның target reset әрекеті туралы жорамал емес.</p>
        <button type="button" className="hw-button hw-button-secondary" onClick={resetModel}>Модельді бастапқыға қайтару</button>
        <p className="hw-muted">Бұл бөлек батырма көріністі 200 → 800-ге қайта құрады; Encoder-ді нөлдеумен шатастырма. Жинаған дәлелдер сақталады.</p>
      </div>
    </div>
    <p className="hw-note" role="status">{state.status === 'reached' ? 'Осы оқу моделінде нысанаға жетті: қалдық 0, қуат пәрмені 0.' : `${state.status === 'running' ? 'Қадамдар орындалып жатыр' : state.status === 'paused' ? 'Кідіртілді, қуат пәрмені 0' : 'Бастауға дайын, қуат пәрмені 0'}. ${direction === 'increase' ? 'Нысана жоғары: Encoder есебі өседі.' : 'Нысана төмен: Encoder есебі кемиді.'} RUN_TO_POSITION үшін қозғалыс қуатының шамасы +0.4; бағытты target пен current айырмасы анықтайды.`}</p>
    {state.resetCount > 0 && <p className="hw-note">Нөлдеу орындалды: current = біліктің модель координатасы − жаңа есеп басы. <code>STOP_AND_RESET_ENCODER</code> білікті механикалық бастапқы орнына апармайды.</p>}
    <figure className="pl-code-figure"><figcaption>Ағымдағы нысана мен күйге сәйкес Java үзіндісі · оқу моделі</figcaption><pre tabIndex={0} aria-label="Жаңаратын Encoder Java пәрмендері"><code lang="en">{encoderLabCode(state)}</code></pre></figure>
    <div className="en-challenges" role="group" aria-label="Encoder Lab тапсырмалары">{encoderChallenges.map((item, index) => <button type="button" className="hw-button hw-button-secondary" key={item.id} aria-pressed={index === challengeIndex} onClick={() => { setState(previous => pauseEncoder(previous)); setChallengeIndex(index); clearAttempt() }}>{solved.includes(item.id) ? '✓ ' : ''}{item.title}</button>)}</div>
    <fieldset className="hw-question en-task"><legend>{challenge.title}</legend><p>{challenge.prompt}</p>
      <button type="button" className="hw-button hw-button-secondary" onClick={() => { const current = challenge.id === 'reference' ? 500 : challenge.current; const target = challenge.id === 'reference' ? 500 : challenge.target; setState(initialEncoderState(current, target)); setTargetText(String(target)); clearAttempt() }}>Тапсырманы дайындау</button>
      {challenge.id === 'reference' && <p className="hw-muted">Дайындау 500/500 күйін ашады. «Encoder есебін нөлдеу» басқанда білік белгісі сол орнында қалады. Одан кейін target 360 орнатып орында.</p>}
      <label className="pl-match-label" htmlFor="en-difference">Бастапқы target − current айырмасы (tick)</label>
      <input id="en-difference" type="number" min="-4000" max="4000" step="1" value={difference} onChange={event => { setDifference(event.target.value); setFeedback(undefined) }} />
      <label className="pl-match-label" htmlFor="en-explanation">Бағыт пен пәрмен ретін түсіндір</label>
      <select id="en-explanation" value={answer} onChange={event => { setAnswer(event.target.value); setFeedback(undefined) }}><option value="">Түсіндірмені таңда…</option>{challenge.options.map((option, index) => <option key={option} value={index}>{option}</option>)}</select>
      {answer !== '' && <p className="hw-muted">Таңдаған түсіндірмең: {challenge.options[Number(answer)]}</p>}
      <button type="button" className="hw-button" disabled={difference === '' || answer === '' || running} onClick={() => { const result = evaluateEncoderChallenge(challenge.id, state, difference, Number(answer)); setFeedback(result); if (result.correct) onSolve(challenge.id) }}>Есеп пен түсіндірмені тексеру</button>
      <div aria-live="polite" aria-atomic="true">{feedback && <p className="hw-feedback" data-kind={feedback.correct ? 'good' : 'bad'}>{feedback.message}</p>}</div>
    </fieldset>
    <button type="button" className="hw-button hw-button-secondary" onClick={() => { onRetry(); resetModel() }}>Lab-ты қайта орындау</button>
    <p className="hw-muted">Қайта орындау тек үш Lab дәлелі мен аяқтау белгісін тазартады. Теория, Java, тест пен жағдаят сақталады. Модель координаталары, қадам күйі және жауап таңдауы қайта жүктегенде сақталмайды; Lab нәтижелері сақталады.</p>
  </section>
}
