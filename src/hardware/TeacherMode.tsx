import { teacher } from './lessons'

function TeachingList({ title, items, ordered = false }: { title: string; items: readonly string[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <section className="hw-teacher-card">
      <h3>{title}</h3>
      <List className="hw-list">{items.map(item => <li key={item}>{item}</li>)}</List>
    </section>
  )
}

export function TeacherMode() {
  return (
    <section className="hw-panel" aria-labelledby="teacher-title">
      <div className="hw-section-head">
        <div><h2 id="teacher-title" lang="en">Teacher Mode</h2>
          <p>Болашақ информатика мұғалімдері үшін. Құрылғыны меңгерумен қатар, оқушының қате түсінігін анықтап, оған тексеру қадамын ұсынуды үйрен.</p></div>
        <span className="hw-count">2 × 50 минут</span>
      </div>
      <p>Сабақтарда Control Hub (басқару блогы), DC Motor (тұрақты ток қозғалтқышы), Encoder (айналымды өлшейтін құрылғы), Servo Motor (сервоқозғалтқыш) және Sensor (датчик) қолданылады.</p>
      <div className="hw-teacher-grid">
        <TeachingList title="Оқу мақсаттары" items={teacher.objectives} />
        <TeachingList title="Сыныптағы тапсырмалар" items={teacher.activities} ordered />
        <TeachingList title="Оқыту тәсілдері" items={teacher.strategies} />
        <TeachingList title="Рефлексия сұрақтары" items={teacher.reflection} ordered />
      </div>
      <section className="hw-teacher-card">
        <h3>Деңгейге сай тапсырмалар</h3>
        <dl className="hw-facts">{teacher.levels.map(([level, assignment]) => (
          <div key={level}><dt>{level}</dt><dd>{assignment}</dd></div>
        ))}</dl>
      </section>
      <section className="hw-teacher-card">
        <h3>Бағалау критерийлері</h3>
        <p>Кестеде әр критерийдің ең жоғары ұпайы мен толық орындалу шарты берілген. Жалпы ұпай — 10.</p>
        <div className="hw-table-scroll" tabIndex={0} role="region" aria-label="Бағалау кестесі">
          <table className="hw-table">
            <thead><tr><th scope="col">Критерий</th><th scope="col">Ұпай</th><th scope="col">Толық орындалу шарты</th></tr></thead>
            <tbody>{teacher.criteria.map(([criterion, score, evidence]) => (
              <tr key={criterion}><th scope="row">{criterion}</th><td>{score}</td><td>{evidence}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section className="hw-teacher-card">
        <h3>Сабақ жоспарлары</h3>
        {teacher.plans.map(plan => (
          <details className="hw-plan" key={plan.title}>
            <summary>{plan.title} <span aria-hidden="true">+</span></summary>
            <ol className="hw-list">{plan.steps.map(([time, step]) => (
              <li key={step}><b>{time}</b> · {step}</li>
            ))}</ol>
          </details>
        ))}
      </section>
    </section>
  )
}
