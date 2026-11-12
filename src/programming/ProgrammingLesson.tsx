import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  sdkScenario, canComplete, concepts, functions, loadProgress, matchingScore, normalizeProgress,
  progressPercent, questions, quizPassed, quizScore, readingSections, saveProgress,
} from './model'
import type { Progress, ReadingId } from './model'
import { LessonScenario, PreviousCompletionNotice, LessonNavigation, LessonQuiz, ReadingSection as SharedReadingSection } from './LessonComponents'
import './programming.css'

const javaExample = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;

@TeleOp(name = "HelloFTC", group = "Academy")
public class HelloFTC extends LinearOpMode {
    @Override
    public void runOpMode() throws InterruptedException {
        telemetry.addData("Status", "Ready");
        telemetry.update();

        waitForStart();

        while (opModeIsActive()) {
            telemetry.addData("A", gamepad1.a);
            telemetry.update();
            idle();
        }
    }
}`

function jumpTo(id: string) {
  const target = document.getElementById('pl-' + id)
  target?.focus({ preventScroll: true })
  target?.scrollIntoView({ block: 'start' })
}

function ReadingSection({ id, read, onRead, children }: {
  id: ReadingId; read: boolean; onRead: () => void; children: ReactNode
}) {
  const section = readingSections.find(item => item.id === id)!
  return <SharedReadingSection id={'pl-' + id} title={section.title} index={readingSections.indexOf(section) + 1} read={read} onRead={onRead}>{children}</SharedReadingSection>
}

export function ProgrammingLesson() {
  const [progress, setProgress] = useState(loadProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  const percent = progressPercent(progress)
  const score = quizScore(progress)
  const matched = matchingScore(progress)
  const answered = questions.filter(question => progress.answers[question.id] !== undefined).length
  const ready = canComplete(progress)

  useEffect(() => { setStorageAvailable(saveProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('programming-lesson')?.scrollIntoView({ block: 'start' })
  }, [])

  function update(change: (previous: Progress) => Progress) {
    setProgress(previous => normalizeProgress(change(previous)))
  }

  function readingProps(id: ReadingId) {
    return {
      id, read: progress.read.includes(id), onRead: () => update(previous => ({
        ...previous,
        read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id],
      })),
    }
  }

  return (
    <div className="hardware-module programming-lesson" id="programming-lesson">
      <header className="topline">
        <span><a href="#home">АКАДЕМИЯ</a> <span className="breadcrumb-divider">/</span> <strong lang="en">FTC PROGRAMMING</strong></span>
        <span className="language">ҚАЗ</span>
      </header>
      <div className="hw-banner">
        <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
        <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 1-САБАҚ</p>
        <h1 ref={heading} tabIndex={-1}>FTC SDK және OpMode негіздері</h1>
        <p>Робот бағдарламасының құрылымын түсін. Ұғымдарды сәйкестендіріп, біліміңді тексер.</p>
        <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 30–40 минут</span></div>
      </div>

      <LessonNavigation current="sdk-opmode" />

      <section className="hw-panel pl-progress" aria-labelledby="pl-progress-title">
        <div className="hw-section-head">
          <h2 id="pl-progress-title">Сабақтағы прогресс</h2>
          <span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span>
        </div>
        <progress className="hw-meter" max={100} value={percent} aria-label="Сабақтағы прогресс">{percent}%</progress>
        <p>Теория: {progress.read.length}/4 · Сәйкестендіру: {matched}/5 · Тест: {score}/5 дұрыс ({answered}/5 жауап берілді) · Жағдаят: {progress.scenarioAnswer === sdkScenario.answer ? 'орындалды' : 'әлі орындалмады'}</p>
        <PreviousCompletionNotice show={progress.previouslyCompleted && !progress.completed} />
        <p className="hw-muted">{storageAvailable ? 'Прогресс осы браузерде автоматты сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда прогресс жоғалады.'}</p>
      </section>

      <nav className="pl-jumps" aria-label="Сабақ бөлімдеріне өту">
        <button className="hw-button hw-button-secondary" type="button" onClick={() => jumpTo('intro')}>Теория</button>
        <button className="hw-button hw-button-secondary" type="button" onClick={() => jumpTo('code')}>Java мысалы</button>
        <button className="hw-button hw-button-secondary" type="button" onClick={() => jumpTo('matching')}>Сәйкестендіру</button>
        <button className="hw-button hw-button-secondary" type="button" onClick={() => jumpTo('quiz')}>Тест</button>
        <button className="hw-button hw-button-secondary" type="button" onClick={() => jumpTo('scenario')}>Жағдаят</button>
        <button className="hw-button hw-button-secondary" type="button" onClick={() => jumpTo('completion')}>Аяқтау</button>
      </nav>

      <section className="hw-panel" aria-labelledby="pl-objectives">
        <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p>
        <h2 id="pl-objectives">Оқу мақсаттары</h2>
        <ul className="hw-list">
          <li>FTC SDK (бағдарламалық әзірлеу жинағы) мен OpMode (роботты басқару бағдарламасы) қызметін түсінесің.</li>
          <li>TeleOp (оператор басқаратын режим) пен Autonomous (автономды режим) айырмасын ажыратасың.</li>
          <li>Java мысалынан START пәрменін күтуді, белсенді циклді және экранға дерек жіберуді табасың.</li>
        </ul>
        <p className="pl-outcome"><b>Күтілетін нәтиже:</b> OpMode орындалу ретін тексеріп, START-қа дейін берілген қозғалыс пәрменінің қатесін табасың.</p>
      <p className="pl-prerequisite">Алдын ала: команда, айнымалы және цикл туралы бастапқы түсінік жеткілікті. Бұл сабақ үшін робот қажет емес.</p>
      </section>

      <ReadingSection {...readingProps('intro')}>
        <p>FIRST Tech Challenge (FTC — робототехника жарысы) командасы роботтың не істейтінін бағдарламада сипаттайды. Java (бағдарламалау тілі) арқылы сол нұсқауларды жаза аламыз.</p>
        <p>Control Hub (басқару блогы) ішіндегі Robot Controller (робот бағдарламасын орындайтын қолданба) таңдалған бағдарламаны іске қосады. Driver Station (оператор станциясы) арқылы бағдарламаны таңдап, іске қосып, тоқтатамыз.</p>
        <p>Gamepad (ойын контроллері) батырмаларының күйін оқу — бағдарламаға кіріс дерек алу мысалы. DC Motor (тұрақты ток қозғалтқышы) қуатын өзгерту — роботқа пәрмен беру мысалы. Бүгін тек деректі оқып, экранға шығаруды қарастырамыз.</p>
      </ReadingSection>

      <ReadingSection {...readingProps('sdk')}>
        <dl className="hw-facts">
          <div><dt>FTC SDK</dt><dd>Робот бағдарламасын әзірлеуге арналған дайын кластар мен әдістер жинағы. Мысалы, Gamepad деректерін оқуға және операторға хабарлама жіберуге көмектеседі.</dd></div>
          <div><dt>OpMode</dt><dd>Роботтың белгілі бір тапсырмадағы әрекетін анықтайтын бағдарлама. Бір роботта бірнеше OpMode болуы мүмкін; қажеттісін Driver Station қолданбасынан таңдаймыз.</dd></div>
          <div><dt>LinearOpMode (ретімен орындалатын OpMode класы)</dt><dd>Осы сабақтағы мысалдың негізі. Нұсқаулар <code>runOpMode()</code> әдісінде ретімен орындалады; <code>while</code> циклі әрекеттерді қайталайды.</dd></div>
        </dl>
        <p className="hw-note">FTC SDK — құралдар жинағы; OpMode — сол құралдармен жазылатын бағдарлама. Java кодын FTC жобасында орындайды. Бұл веб-бетте Java кодын іске қосу қарастырылмаған.</p>
      </ReadingSection>

      <ReadingSection {...readingProps('modes')}>
        <div className="pl-mode-grid">
          <article className="hw-detail"><h3>TeleOp</h3><p>Оператор Gamepad арқылы бағдарламаға пәрмен береді. Бағдарлама сол деректерді өңдейді.</p><p><b>Мысал:</b> оператор батырманы басқанда оның күйін экранда көрсету.</p><code>@TeleOp</code></article>
          <article className="hw-detail"><h3>Autonomous</h3><p>Робот адам басқаруынсыз, алдын ала жазылған алгоритммен әрекет етеді. Алгоритм датчик деректерін де қолдана алады.</p><p><b>Мысал:</b> қашықтықты өлшеп, белгіленген шекке жеткенде тоқтау.</p><code>@Autonomous</code></article>
        </div>
        <p>Екеуі де OpMode. Annotation (класты белгілейтін Java жазбасы) бағдарламаның қай тізімде көрінетінін анықтайды. Тек <code>@TeleOp</code> жазуын <code>@Autonomous</code> деп ауыстыру роботқа өздігінен қозғалу алгоритмін қоспайды.</p>
      </ReadingSection>

      <ReadingSection {...readingProps('code')}>
        <p><b>Мақсат:</b> Gamepad-тағы A батырмасының күйін Telemetry (операторға жіберілетін күй деректері) арқылы көрсету. Мысал моторларды басқармайды.</p>
        <figure className="pl-code-figure">
          <figcaption>HelloFTC.java · FTC SDK жобасына арналған мысал</figcaption>
          <pre tabIndex={0} aria-label="HelloFTC Java коды, көлденең айналдыруға болады"><code lang="en">{javaExample}</code></pre>
        </figure>
        <ol className="hw-list pl-code-notes">
          <li><code>package</code> пен <code>import</code> кластың орнын және қолданылатын FTC SDK кластарын көрсетеді. <code>HelloFTC.java</code> файлының аты <code>HelloFTC</code> класына сәйкес болуы керек.</li>
          <li><code>@TeleOp</code> бағдарламаны TeleOp тізіміне қосады; <code>name</code> — сол тізімдегі атауы. <code>extends LinearOpMode</code> дайын кластың мүмкіндіктерін пайдаланады.</li>
          <li><code>runOpMode()</code> — орындалатын нұсқаулардың орны. <code>telemetry.addData()</code> деректі дайындайды, <code>telemetry.update()</code> оны Driver Station экранына жібереді. INIT (дайындау) кезінде <code>Status: Ready</code> көрінеді.</li>
          <li><code>waitForStart()</code> START (іске қосу) пәрменін күтеді. STOP (тоқтату) сұрауы бұл күтуді үзе алады.</li>
          <li><code>while (opModeIsActive())</code> тек белсенді OpMode кезінде қайталанады. <code>gamepad1.a</code> — A басылса <code>true</code>, басылмаса <code>false</code>. <code>idle()</code> басқа жүйелік жұмыстарға орындалу уақытын береді. STOP сұралғанда цикл аяқталады.</li>
        </ol>
        <p className="hw-note">Нақты FTC жобасында файлды <code>TeamCode/src/main/java/org/firstinspires/ftc/teamcode/</code> ішіне қосып, Robot Controller қолданбасын құрастырып орнатады. Қосылған Gamepad пен Driver Station қажет. Бұл беттегі жаттығулар — оқу тапсырмалары; олар роботты басқармайды және нақты робот симуляциясы емес.</p>
        <p><b>Өзіңді тексер:</b> START басылғанша <code>gamepad1.a</code> экранға жіберіле ме? <b>Жауап:</b> жоқ, ол <code>waitForStart()</code> шақыруынан кейінгі циклде тұр.</p>
      </ReadingSection>

      <section className="hw-panel" aria-labelledby="pl-matching">
        <div className="hw-section-head"><div><p className="hw-kicker">ЖАТТЫҒУ / 01</p><h2 id="pl-matching" tabIndex={-1}>Ұғымды қызметімен сәйкестендір</h2></div><span className="hw-count">{matched}/5 дұрыс</span></div>
        <p>Әр ұғымға сәйкес қызметті тізімнен таңда. Әр таңдаудан кейін түсіндірме беріледі; қате таңдауды өзгертуге болады. Пернетақтада Tab және бағыттау пернелерін қолдан.</p>
        <div className="pl-matches">
          {concepts.map(concept => {
            const selected = progress.matches[concept.id] ?? ''
            const correct = selected === concept.answer
            return (
              <div className="hw-detail" key={concept.id}>
                <label className="pl-match-label" htmlFor={'pl-match-' + concept.id}><code>{concept.term}</code></label>
                <select id={'pl-match-' + concept.id} value={selected} aria-describedby={selected ? 'pl-match-feedback-' + concept.id : undefined}
                  onChange={event => {
                    const value = event.target.value
                    update(previous => ({ ...previous, matches: { ...previous.matches, [concept.id]: value } }))
                  }}>
                  <option value="">Қызметін таңда…</option>
                  {functions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                <div aria-live="polite" aria-atomic="true">
                  {selected && <div id={'pl-match-feedback-' + concept.id} className="hw-feedback" data-kind={correct ? 'good' : 'bad'}>
                    <strong>{correct ? '✓ Дұрыс!' : 'Қайта ойланып көр.'}</strong><p>{concept.explanation}</p>
                  </div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <LessonQuiz id="pl-quiz" questions={questions} answers={progress.answers}
        onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : {
          ...previous, answers: { ...previous.answers, [id]: answer },
        })}
        onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))}
        retryNote="Қайта бастағанда тест жауаптары мен сабақтың аяқталу белгісі жаңартылады. Теория, сәйкестендіру және жағдаят сақталады." />

    <LessonScenario id="pl-scenario" question={sdkScenario} answer={progress.scenarioAnswer}
      onAnswer={answer => update(previous => previous.scenarioAnswer !== undefined ? previous : { ...previous, scenarioAnswer: answer })}
      onRetry={() => update(previous => ({ ...previous, scenarioAnswer: undefined, completed: false }))} />

      <section className="hw-panel" aria-labelledby="pl-completion">
        <h2 id="pl-completion" tabIndex={-1}>Сабақты аяқтау</h2>
        <ul className="pl-checklist">
          <li>{progress.read.length === 4 ? '✓' : '○'} Төрт теория бөлімін оқылған деп белгілеу ({progress.read.length}/4)</li>
          <li>{matched === 5 ? '✓' : '○'} Бес ұғымды дұрыс сәйкестендіру ({matched}/5)</li>
          <li>{quizPassed(progress) ? '✓' : '○'} Бес сұраққа жауап беру және кемінде 4/5 жинау ({answered}/5 жауап, {score}/5 дұрыс)</li>
          <li>{progress.scenarioAnswer === sdkScenario.answer ? '✓' : '○'} Қолданбалы жағдаятты дұрыс орындау</li>
        </ul>
        <button className="hw-button" type="button" disabled={!ready || progress.completed} aria-describedby="pl-completion-help"
          onClick={() => update(previous => ({ ...previous, completed: true }))}>
          {progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}
        </button>
        <div aria-live="polite" aria-atomic="true">
          <p id="pl-completion-help" className={progress.completed ? 'hw-success' : 'hw-muted'}>
            {progress.completed ? 'Жарайсың! FTC SDK және OpMode негіздерін меңгердің.' : ready ? 'Барлық шарт орындалды. Аяқтау батырмасын бас.' : 'Батырма жоғарыдағы төрт шарт орындалғанда ашылады.'}
          </p>
        </div>
      </section>

      <LessonNavigation current="sdk-opmode" pager />

      <aside className="hw-panel hw-sources" aria-labelledby="pl-sources">
        <h2 id="pl-sources">Ресми дереккөздер</h2>
        <p className="hw-muted">Мысал мен түсіндірмелер FIRST Tech Challenge материалдарымен салыстырылды · 11.11.2026.</p>
        <ul>
          <li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/control_system_intro/The-FTC-Control-System.html" target="_blank" rel="noreferrer">Басқару жүйесі және режимдер (English, жаңа бет)</a></li>
          <li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/android_studio/creating_op_modes/Creating-and-Running-an-Op-Mode-(Android-Studio).html" target="_blank" rel="noreferrer">OpMode құру және орындау (English, жаңа бет)</a></li>
          <li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController" target="_blank" rel="noreferrer">FTC SDK ресми репозиторийі (English, жаңа бет)</a></li>
        </ul>
      </aside>
    </div>
  )
}
