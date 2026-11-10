import { useRef, useState } from 'react'
import { questions, scenarios } from './lessons'
import { diagnosisMatches, quizScore } from './model'
import type { Progress } from './model'

export function Quiz({ answers, onAnswer, onRetry }: {
  answers: Progress['quiz']
  onAnswer: (id: string, answer: number) => void
  onRetry: () => void
}) {
  const [index, setIndex] = useState(() => {
    const unanswered = questions.findIndex(question => answers[question.id] === undefined)
    return unanswered < 0 ? questions.length - 1 : unanswered
  })
  const question = questions[index]
  const selected = answers[question.id]
  const answered = selected !== undefined
  const count = Object.keys(answers).length
  const complete = count === questions.length
  const questionHeading = useRef<HTMLHeadingElement>(null)

  function goTo(next: number) {
    setIndex(next)
    questionHeading.current?.focus()
  }

  return (
    <section className="hw-panel" aria-labelledby="quiz-title">
      <div className="hw-section-head">
        <div><h2 id="quiz-title" lang="en">Quiz</h2>
          <p>Әр сұраққа бір жауап таңда. Түсіндірме бірден ашылады.</p></div>
        <span className="hw-count">{count}/{questions.length} жауап берілді</span>
      </div>
      <progress className="hw-meter" aria-label="Жауап берілген сұрақтар" max={questions.length} value={count} />
      {complete && (
        <div className="hw-feedback hw-quiz-result" data-kind="good" role="status">
          <strong>Қорытынды ұпай</strong>
          <p><b>{quizScore(answers)} / {questions.length}</b> дұрыс жауап</p>
          <button type="button" className="hw-button" onClick={() => {
            onRetry()
            goTo(0)
          }}>Қайта тапсыру</button>
        </div>
      )}
      <div className="hw-question">
        <p className="hw-kicker">СҰРАҚ {index + 1} / {questions.length}</p>
        <h3 id="hw-question" tabIndex={-1} ref={questionHeading}>{question.prompt}</h3>
        <div className="hw-options" role="group" aria-labelledby="hw-question">
          {question.options.map((option, optionIndex) => {
            const correct = answered && optionIndex === question.answer
            const wrong = answered && optionIndex === selected && !correct
            return (
              <button key={optionIndex} type="button" className="hw-option" disabled={answered}
                data-result={correct ? 'correct' : wrong ? 'wrong' : undefined}
                onClick={() => onAnswer(question.id, optionIndex)}>
                <span aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
                {option}
                {correct && <small>Дұрыс жауап</small>}
                {wrong && <small>Сенің жауабың</small>}
              </button>
            )
          })}
        </div>
        <div aria-live="polite">
          {answered && (
            <div className="hw-feedback" data-kind={selected === question.answer ? 'good' : 'bad'}>
              <strong>{selected === question.answer ? 'Дұрыс жауап' : 'Бұл жауап сәйкес келмейді'}</strong>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
        <div className="hw-actions">
          <button type="button" className="hw-button hw-button-secondary" disabled={index === 0}
            onClick={() => goTo(index - 1)}>Алдыңғы сұрақ</button>
          <button type="button" className="hw-button" disabled={!answered || index === questions.length - 1}
            onClick={() => goTo(index + 1)}>Келесі сұрақ</button>
        </div>
      </div>
    </section>
  )
}

function ScenarioForm({ scenario, saved, onSubmit, onRetry }: {
  scenario: (typeof scenarios)[number]
  saved?: number[]
  onSubmit: (choices: number[]) => void
  onRetry: () => void
}) {
  const [draft, setDraft] = useState<number[]>([])
  const submitted = saved !== undefined
  const selected = saved ?? draft
  const allMatched = submitted && diagnosisMatches(scenario.choices, selected)

  return (
    <div className="hw-question">
      <h3 id="hw-scenario-title">{scenario.title}</h3>
      <p>{scenario.symptom}</p>
      <fieldset className="hw-causes">
        <legend>Ықтимал себептердің бәрін белгіле</legend>
        {scenario.choices.map((choice, index) => {
          const checked = selected.includes(index)
          return (
            <div className="hw-cause" key={choice.label}>
              <label>
                <input type="checkbox" checked={checked} disabled={submitted} onChange={event => {
                  const next = event.currentTarget.checked
                  setDraft(previous => next ? [...previous, index] : previous.filter(item => item !== index))
                }} />
                <span>{choice.label}</span>
              </label>
              {submitted && (
                <p className="hw-cause-feedback">
                  <strong>{choice.plausible ? checked ? 'Ықтимал себеп' : 'Ескерілмеген ықтимал себеп' : checked ? 'Бұл жағдайға сәйкес емес' : 'Ықтимал себеп емес'}.</strong>{' '}
                  {choice.feedback}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>
      <div aria-live="polite">
        {submitted && (
          <div className="hw-feedback" data-kind={allMatched ? 'good' : 'note'}>
            <strong>{allMatched ? 'Берілген жағдайдағы ықтимал себептерді дұрыс таңдадың' : 'Таңдауыңды берілген белгілермен салыстыр'}</strong>
            <p><b>Келесі тексеріс.</b> {scenario.next}</p>
          </div>
        )}
      </div>
      {submitted ? (
        <button type="button" className="hw-button hw-button-secondary" onClick={() => {
          setDraft([])
          onRetry()
        }}>Жағдайды қайта талдау</button>
      ) : (
        <button type="button" className="hw-button" disabled={draft.length === 0}
          onClick={() => onSubmit(draft)}>Болжамды тексеру</button>
      )}
    </div>
  )
}

export function Troubleshooting({ diagnoses, onChange }: {
  diagnoses: Progress['diagnoses']
  onChange: (diagnoses: Progress['diagnoses']) => void
}) {
  const [index, setIndex] = useState(0)
  const scenario = scenarios[index]
  return (
    <section className="hw-panel" aria-labelledby="troubleshooting-title">
      <div className="hw-section-head">
        <div><h2 id="troubleshooting-title" lang="en">Troubleshooting Lab</h2>
          <p>Бір белгі бірнеше себептен туындауы мүмкін. Болжамдарды таңда да, оларды ажырататын сынақты қарастыр.</p></div>
        <span className="hw-count">{Object.keys(diagnoses).length}/{scenarios.length} талданды</span>
      </div>
      <div className="hw-scenarios" role="group" aria-label="Ақау жағдайлары">
        {scenarios.map((item, itemIndex) => (
          <button type="button" key={item.id} className="hw-button hw-button-secondary"
            aria-pressed={itemIndex === index} onClick={() => setIndex(itemIndex)}>
            {itemIndex + 1}. {item.title}{diagnoses[item.id] ? ' ✓' : ''}
          </button>
        ))}
      </div>
      <ScenarioForm key={scenario.id} scenario={scenario} saved={diagnoses[scenario.id]}
        onSubmit={choices => onChange({ ...diagnoses, [scenario.id]: choices })}
        onRetry={() => {
          const next = { ...diagnoses }
          delete next[scenario.id]
          onChange(next)
        }} />
    </section>
  )
}
