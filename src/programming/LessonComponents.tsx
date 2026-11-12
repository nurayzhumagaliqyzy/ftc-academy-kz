import type { ReactNode } from 'react'
import { programmingLessons } from './routes'
import type { LessonId } from './routes'
import '../hardware/hardware.css'
import './programming.css'

export function LessonNavigation({ current, pager = false }: { current: LessonId; pager?: boolean }) {
  const index = programmingLessons.findIndex(lesson => lesson.id === current)
  if (pager) {
    const previous = programmingLessons[index - 1]
    const next = programmingLessons[index + 1]
    return <nav className="pl-lesson-pager" aria-label="Алдыңғы және келесі сабақ">
      {previous && <a className="hw-button hw-button-secondary" href={'#' + previous.hash}>← {index}-сабақ: {previous.title}</a>}
      <a className="hw-button hw-button-secondary" href="#programming/lessons">Барлық сабақ</a>
      {next && <a className="hw-button" href={'#' + next.hash}>{index + 2}-сабақ: {next.title} →</a>}
    </nav>
  }
  return <nav className="hw-tabs pl-lesson-tabs" aria-label="FTC Programming сабақтары">
    <a href="#programming/lessons">Сабақтар тізімі</a>
    {programmingLessons.map((lesson, i) => <a key={lesson.id} href={'#' + lesson.hash}
      aria-current={lesson.id === current ? 'page' : undefined}>{i + 1}-сабақ: {lesson.title}</a>)}
  </nav>
}

export function ReadingSection({ id, title, index, read, onRead, children }: {
  id: string; title: string; index: number; read: boolean; onRead: () => void; children: ReactNode
}) {
  return <section className="hw-panel" aria-labelledby={id}>
    <p className="hw-kicker">ТЕОРИЯ / 0{index}</p>
    <h2 id={id} tabIndex={-1}>{title}</h2>
    {children}
    <button className="hw-button hw-button-secondary pl-read" type="button" aria-pressed={read} onClick={onRead}>
      {read ? '✓ Оқылды' : 'Оқыдым, түсіндім'}
    </button>
  </section>
}

export type QuizQuestion = { id: string; prompt: string; options: readonly string[]; answer: number; explanation: string }

export function LessonQuiz({ id, questions, answers, onAnswer, onRetry, retryNote }: {
  id: string; questions: readonly QuizQuestion[]; answers: Record<string, number>
  onAnswer: (id: string, answer: number) => void; onRetry: () => void; retryNote: string
}) {
  const score = questions.filter(question => answers[question.id] === question.answer).length
  const answered = questions.filter(question => answers[question.id] !== undefined).length
  return <section className="hw-panel" aria-labelledby={id}>
    <div className="hw-section-head"><div><p className="hw-kicker">ӨЗІҢДІ ТЕКСЕР</p><h2 id={id} tabIndex={-1}>Бес сұрақтық тест</h2></div><span className="hw-count">{score}/5 дұрыс</span></div>
    <p>Әр сұрақта бір дұрыс жауап бар. Жауапты басқан бойда нәтиже мен түсіндірме ашылады. Аяқтау үшін барлық сұраққа жауап беріп, кемінде 4/5 жина. Қажет болса, тестті қайта баста.</p>
    <div className="pl-questions">
      {questions.map((question, index) => {
        const answer = answers[question.id]
        const hasAnswer = answer !== undefined
        return <fieldset className="hw-question pl-question" key={question.id}>
          <legend>{index + 1}. {question.prompt}</legend>
          <div className="hw-options">
            {question.options.map((option, optionIndex) => <button key={option} type="button" className="hw-option" disabled={hasAnswer}
              aria-pressed={answer === optionIndex}
              data-result={hasAnswer && optionIndex === question.answer ? 'correct' : answer === optionIndex ? 'wrong' : undefined}
              onClick={() => onAnswer(question.id, optionIndex)}>
              <span aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>{option}
              {hasAnswer && optionIndex === question.answer && <small>✓ Дұрыс жауап</small>}
              {answer === optionIndex && optionIndex !== question.answer && <small>Сенің жауабың</small>}
            </button>)}
          </div>
          <div aria-live="polite" aria-atomic="true">
            {hasAnswer && <div className="hw-feedback" data-kind={answer === question.answer ? 'good' : 'bad'}>
              <strong>{answer === question.answer ? '✓ Дұрыс!' : 'Бұл жауап қате.'}</strong><p>{question.explanation}</p>
            </div>}
          </div>
        </fieldset>
      })}
    </div>
    <div className="pl-quiz-summary" aria-live="polite">
      {answered === questions.length && <p className="hw-feedback" data-kind={score >= 4 ? 'good' : 'bad'}>
        {score >= 4 ? `Тесттен өттің! Нәтиже: ${score}/5.` : `Нәтиже: ${score}/5. Түсіндірмелерді оқып, тестті қайта орында.`}
      </p>}
    </div>
    <button className="hw-button hw-button-secondary" type="button" disabled={answered === 0} onClick={() => {
      onRetry()
      const target = document.getElementById(id)
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'start' })
    }}>Тестті қайта бастау</button>
    <p className="hw-muted pl-retry-note">{retryNote}</p>
  </section>
}

export type CodeTask = { id: string; prompt: string; before: string; after: string; options: readonly string[]; answer: string; explanation: string }
export function LessonCodeExercise({ id, tasks, answers, onChange, title = 'TeleOp кодын толықтыр' }: {
  id: string; title?: string; tasks: readonly CodeTask[]; answers: Record<string, string>; onChange: (id: string, value: string) => void
}) {
  return <section className="hw-panel" aria-labelledby={id}>
    <div className="hw-section-head"><div><p className="hw-kicker">JAVA / БОС ОРЫНДЫ ТОЛТЫР</p><h2 id={id} tabIndex={-1}>{title}</h2></div><span className="hw-count">{tasks.filter(task => answers[task.id] === task.answer).length}/{tasks.length} дұрыс</span></div>
    <p>Әр үзіндіге сәйкес Java бөлігін таңда. Қате жауапты өзгерте аласың. Бұл — оқу тапсырмасы, Java компиляторы емес; код орындалмайды.</p>
    <div className="pl-matches">
      {tasks.map((task, index) => {
        const selected = answers[task.id] ?? ''
        return <div className="hw-detail" key={task.id}>
          <label className="pl-match-label" htmlFor={`${id}-${task.id}`}>{index + 1}. {task.prompt}</label>
          <pre className="pl-exercise-code"><code lang="en">{task.before}<mark>{selected || '___'}</mark>{task.after}</code></pre>
          <select id={`${id}-${task.id}`} value={selected} aria-describedby={selected ? `${id}-${task.id}-feedback` : undefined} onChange={event => onChange(task.id, event.target.value)}>
            <option value="">Java бөлігін таңда…</option>{task.options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <div aria-live="polite" aria-atomic="true">{selected && <div className="hw-feedback" id={`${id}-${task.id}-feedback`} data-kind={selected === task.answer ? 'good' : 'bad'}><strong>{selected === task.answer ? '✓ Дұрыс!' : 'Бұл бөлік сәйкес емес.'}</strong><p>{task.explanation}</p></div>}</div>
        </div>
      })}
    </div>
    <p className="hw-muted">Бұл — жеке үзінділер. Толық бағдарламаның реті төменде берілген.</p>
  </section>
}
