import { useEffect, useRef, useState } from 'react'
import { LessonScenario, PreviousCompletionNotice, LessonCodeExercise, LessonNavigation, LessonQuiz, ReadingSection } from './LessonComponents'
import { AutonomousLab } from './AutonomousLab'
import {
  autonomousCodeScore, autonomousCodeTasks, autonomousJavaExample, autonomousJavaLines, autonomousProgressPercent,
  autonomousScenario, autonomousQuestions, autonomousQuizPassed, autonomousQuizScore, autonomousReadings, canCompleteAutonomous,
  loadAutonomousProgress, normalizeAutonomousProgress, saveAutonomousProgress,
} from './autonomousModel'
import type { AutonomousProgress, AutonomousReadingId } from './autonomousModel'
import './autonomous.css'

export function AutonomousLesson() {
  const [progress, setProgress] = useState(loadAutonomousProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setStorageAvailable(saveAutonomousProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('autonomous-lesson')?.scrollIntoView({ block: 'start' })
  }, [])
  function update(change: (previous: AutonomousProgress) => AutonomousProgress) { setProgress(previous => normalizeAutonomousProgress(change(previous))) }
  function readingProps(id: AutonomousReadingId) {
    const index = autonomousReadings.findIndex(section => section.id === id)
    return { id: 'al-' + id, title: autonomousReadings[index].title, index: index + 1, read: progress.read.includes(id),
      onRead: () => update(previous => ({ ...previous, read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id] })) }
  }
  function jumpTo(id: string) { const target = document.getElementById('al-' + id); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' }) }
  const ready = canCompleteAutonomous(progress)
  const percent = autonomousProgressPercent(progress)
  const answered = autonomousQuestions.filter(question => progress.answers[question.id] !== undefined).length
  return <div className="hardware-module programming-lesson autonomous-lesson" id="autonomous-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 4-САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>Autonomous (автономды режим) негіздері</h1>
      <p>Алдыңғы сабақта робот оператордың әрекетіне жауап берді. Енді алдын ала жоспарланған нұсқаулар тізбегін құрастырасың.</p>
      <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 45–55 минут</span></div>
    </div>
    <LessonNavigation current="autonomous" />
    <section className="hw-panel pl-progress" aria-labelledby="al-progress">
      <div className="hw-section-head"><h2 id="al-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span></div>
      <progress className="hw-meter" max={100} value={percent} aria-label="Төртінші сабақтағы прогресс">{percent}%</progress>
      <p>Теория: {progress.read.length}/4 · Path Lab: {progress.solved.length}/3 · Java: {autonomousCodeScore(progress)}/6 · Тест: {autonomousQuizScore(progress)}/5 · Жағдаят: {progress.scenarioAnswer === autonomousScenario.answer ? 'орындалды' : 'әлі орындалмады'}</p>
      <PreviousCompletionNotice show={progress.previouslyCompleted && !progress.completed} />
        <p className="hw-muted" role="status">{storageAvailable ? 'Осы сабақтың прогресі браузерде бөлек сақталады. Алдыңғы үш сабақтың нәтижелері сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда осы сабақтағы жаңа прогресс жоғалады.'}</p>
    </section>
    <nav className="pl-jumps" aria-label="Төртінші сабақ бөлімдері">
      {[['mode', 'Теория'], ['lab', 'Path Lab'], ['code-exercise', 'Java тапсырмасы'], ['example', 'Толық Java мысалы'], ['quiz', 'Тест'], ['scenario', 'Жағдаят'], ['completion', 'Аяқтау']].map(([id, label]) => <button type="button" className="hw-button hw-button-secondary" key={id} onClick={() => jumpTo(id)}>{label}</button>)}
    </nav>
    <section className="hw-panel" aria-labelledby="al-objectives">
      <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p><h2 id="al-objectives">Оқу мақсаттары</h2>
      <ul className="hw-list"><li>Autonomous пен TeleOp (оператор басқаратын режим) айырмасын түсінесің.</li><li>Бастапқы орын, бағыт және нысана бойынша алгоритм құрастырасың.</li><li>Нұсқаулардың ретін тексеріп, қатесін түзетесің.</li><li>Бір DC Motor (тұрақты ток қозғалтқышы) үшін уақытпен басқару кодын оқып, оның шектеуін түсінесің.</li></ul>
      <p className="pl-outcome"><b>Күтілетін нәтиже:</b> Нысанаға жеткізетін торлы алгоритм құрып, қате бұрылуды түзетесің және уақытпен қозғалыстың шектеуін түсіндіресің.</p>
      <p className="pl-prerequisite">Дайындық: <a className="hw-back" href="#programming/gamepad-teleop">3-сабақтағы TeleOp пен басқару циклін қайтала →</a></p>
    </section>
    <ReadingSection {...readingProps('mode')}>
      <p>Autonomous кезінде робот тапсырманы оператордың үздіксіз Gamepad (ойын контроллері) басқаруынсыз орындайды. Алгоритм — не істеу керегін және қандай ретпен орындау керегін көрсететін нұсқаулар жиыны. Робот нысанаға қалай жететінін өздігінен «болжамайды»: логиканы бағдарламалаушы жазады.</p>
      <p>Мысалы, алдымен механизмді іске қосу, белгілі уақыт күту, содан кейін оны тоқтату. Sensor (датчик) деректері қолданылса, бағдарлама жағдайға қарай әрекет таңдай алады. «Алдын ала жазылған» деген тек өзгермейтін бір тізіммен шектелмейді.</p>
      <dl className="hw-facts"><div><dt>TeleOp</dt><dd>Оператордың ағымдағы Gamepad кірісіне жауап береді. Мысалы, тетіктің мәні мотор қуатын өзгертеді.</dd></div><div><dt>Autonomous</dt><dd>Жазылған алгоритмге және қажет болса сенсор деректеріне сүйенеді. START берілгеннен кейін қадамдарды өзі орындайды.</dd></div></dl>
      <p>Екі режимде де OpMode (роботты басқару бағдарламасы) робот жағында орындалады. Driver Station (оператор станциясы) арқылы бағдарлама таңдалады, INIT (дайындау), START (іске қосу) және STOP (тоқтату) пәрмендері беріледі. Control Hub (басқару блогы) моторларға пәрмен жеткізеді.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('structure')}>
      <ol className="hw-list"><li><code>@Autonomous</code> бағдарламаны Autonomous тізіміне енгізеді; ол қозғалыс бағытын өзі анықтамайды.</li><li><code>LinearOpMode</code> құрылымында негізгі әрекеттер <code>runOpMode()</code> ішінде ретімен орындалады.</li><li>Дайындауда <code>hardwareMap.get()</code> моторды конфигурациядағы атаумен табады; бастапқы қуат нөлге қойылады.</li><li><code>waitForStart()</code> START-ты күтеді. Қозғалыс пәрмендері одан кейін беріледі.</li><li><code>opModeIsActive()</code> бағдарламаның әлі белсенді екенін тексереді. Әр жаңа қозғалыс кезеңінің алдында STOP берілмегеніне көз жеткіз.</li><li><code>finally</code> орындалу блогынан шыққанда мотор қуатын нөлдеуге көмектеседі.</li></ol>
      <p className="hw-note">Бір рет орындалатын Autonomous әрекетіне міндетті түрде шексіз цикл қажет емес. Қысқа тізбек ретімен аяқтала алады. Қайталау керек болса, циклдің шартында <code>opModeIsActive()</code> ескерілсін.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('time')}>
      <p><code>motor.setPower(0.3); sleep(1000); motor.setPower(0);</code> — моторға қуат беріп, шамамен 1 секундтан кейін нөлдеу мысалы. <code>sleep()</code> миллисекундпен күтеді: 1000 мс = 1 с. Күту кезінде берілген қуат сақталады, сондықтан <code>sleep()</code> тоқтату пәрмені емес.</p>
      <p>Уақытпен басқару оңай, бірақ нақты қашықтыққа кепіл болмайды. Мотор түрі, жүктеме, батарея кернеуі, механизмнің үйкелісі және дөңгелек сырғанау нәтижені өзгерте алады. Бірдей қуат пен уақыт әр сынақта дәл бірдей жол бермеуі мүмкін.</p>
      <p>Encoder (айналымды өлшейтін құрылғы) біліктің қанша айналғанын хабарлайды. Бағдарлама осы кері байланысты мақсатпен салыстырып, қозғалыстың қайталану дәлдігін жақсарта алады. Encoder роботтың өрістегі орнын тікелей өлшемейді және дөңгелек сырғанауын толық жоймайды; өлшемдер мен дұрыс баптау қажет.</p>
      <p className="hw-note">Бір моторды айналдыру толық роботты жүргізу не бұру деген сөз емес. Drivetrain (роботтың жүріс жүйесі) дөңгелектерді және олардың бірнеше мотор арқылы бірге басқарылуын қамтуы мүмкін. Бұл сабақта нақты Drivetrain бағдарламасын жасамаймыз; Java мысалы — бекітілген бір мотордың демонстрациясы.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('planning')}>
      <ol className="hw-list"><li><b>Мақсат қой:</b> бастапқы орын, бастапқы бағыт және нысананы жаз.</li><li><b>Жоспарла:</b> әр қадамнан кейін координата мен бағыт қалай өзгеретінін қағазға белгіле.</li><li><b>Қадамдап тексер:</b> күткен орын мен нақты көрсетілген орынды салыстыр. Алғашқы айырмашылықты тап.</li><li><b>Бір қатені түзет:</b> «Алға» саны артық па, бұрылу бағыты қате ме, Stop ерте тұр ма?</li><li><b>Басынан сына:</b> түзетуден кейін бірдей бастапқы күйден қайта орында.</li></ol>
      <p>Debugging (қатені іздеу және түзету) кезінде <code>telemetry</code> (операторға дерек көрсету құралы) арқылы күйді бақылауға болады. Алдымен қауіпсіз, қысқа әрекетті тексер, содан кейін келесі кезеңді қос.</p>
      <p className="hw-note">Төмендегі торда X оңға, Y жоғары өседі. «Алға» — экранның жоғары жағына емес, робот қарап тұрған бағытқа жылжу. Бұрылу орынды өзгертпейді. Браузердегі Stop алгоритмді аяқтайды; бұл — оқу моделінің ережесі.</p>
    </ReadingSection>
    <AutonomousLab solved={progress.solved} onSolve={id => update(previous => ({ ...previous, solved: previous.solved.includes(id) ? previous.solved : [...previous.solved, id] }))} />
    <LessonCodeExercise id="al-code-exercise" title="Autonomous кодын толықтыр" tasks={autonomousCodeTasks} answers={progress.code} onChange={(id, value) => update(previous => ({ ...previous, code: { ...previous.code, [id]: value } }))} />
    <section className="hw-panel" aria-labelledby="al-example">
      <p className="hw-kicker">БІР МОТОРЛЫ ДЕМОНСТРАЦИЯ</p><h2 id="al-example" tabIndex={-1}>TimedMotor.java · толық Autonomous мысалы</h2>
      <p>Бұл FTC SDK (бағдарламалық әзірлеу жинағы) мысалы бір моторды 0.3 қуатпен шамамен 1 секунд айналдырады. Конфигурацияда <code>motor</code> атаулы мотор болсын. Ол Path Lab-тағы «бір ұяшық» не «90°» пәрмендерін орындамайды және толық роботты жүргізбейді.</p>
      <figure className="pl-code-figure"><figcaption>TimedMotor.java · FTC SDK жобасына арналған</figcaption><pre tabIndex={0} aria-label="Толық Autonomous Java мысалы"><code lang="en">{autonomousJavaExample}</code></pre></figure>
      <details className="al-hint"><summary>Java кодын жолма-жол түсіну</summary><p>Нөмірлер жоғарыдағы файл жолдарына сәйкес келеді; бос жолдар тек оқуға ыңғайлы болу үшін қалдырылған.</p><ol className="al-code-notes">{autonomousJavaLines.map(([line, note], index) => note && <li key={index} value={index + 1}><code lang="en">{line.trim()}</code><p>{note}</p></li>)}</ol></details>
      <p className="hw-note">Нақты сынақта моторды бекіт, айналатын бөлшектерге жақындама; дөңгелек жалғанса, оны жерден көтер. STOP басқанда қуат нөлденетінін тексер. BRAKE нөлдік қуатта айналуға кедергі келтіреді, бірақ позицияны дәл ұстамайды; білік инерциямен қозғала алады. Код қорек жоғалуы сияқты жағдайларды басқара алмайды. Бұл бет Java кодын құрастырмайды және роботта орындамайды.</p>
    </section>
    <LessonQuiz id="al-quiz" questions={autonomousQuestions} answers={progress.answers}
      onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : { ...previous, answers: { ...previous.answers, [id]: answer } })}
      onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))}
      retryNote="Тестті қайта бастау тек осы сабақтың тест жауаптары мен аяқталу белгісін жаңартады. Теория, орындалған үш тапсырма, Java жауаптары және жағдаят сақталады." />
    <LessonScenario id="al-scenario" question={autonomousScenario} answer={progress.scenarioAnswer}
      onAnswer={answer => update(previous => previous.scenarioAnswer !== undefined ? previous : { ...previous, scenarioAnswer: answer })}
      onRetry={() => update(previous => ({ ...previous, scenarioAnswer: undefined, completed: false }))} />

    <section className="hw-panel" aria-labelledby="al-completion">
      <h2 id="al-completion" tabIndex={-1}>Сабақты аяқтау</h2>
      <ul className="pl-checklist"><li>{progress.read.length === 4 ? '✓' : '○'} Теорияны оқу ({progress.read.length}/4)</li><li>{progress.solved.length === 3 ? '✓' : '○'} Path Lab тапсырмалары ({progress.solved.length}/3)</li><li>{autonomousCodeScore(progress) === 6 ? '✓' : '○'} Java тапсырмасы ({autonomousCodeScore(progress)}/6)</li><li>{autonomousQuizPassed(progress) ? '✓' : '○'} Тест: барлық бес сұраққа жауап және кемінде 4/5 ({answered}/5 жауап, {autonomousQuizScore(progress)}/5 дұрыс)</li>  <li>{progress.scenarioAnswer === autonomousScenario.answer ? '✓' : '○'} Қолданбалы жағдаятты дұрыс орындау</li>
        </ul>
      <button type="button" className="hw-button" disabled={!ready || progress.completed} onClick={() => update(previous => ({ ...previous, completed: true }))}>{progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}</button>
      <p role="status">{progress.completed ? 'Жарайсың! Алгоритмді жоспарлап, қадамдап тексеруді үйрендің. Сабаққа қайта оралып, тапсырмаларды қайталай аласың.' : 'Аяқтау батырмасы жоғарыдағы бес шарт орындалғанда ашылады.'}</p>
    </section>
    <LessonNavigation current="autonomous" pager />
    <section className="hw-panel" aria-labelledby="al-sources"><h2 id="al-sources">Ресми дереккөздер</h2><p>FIRST Tech Challenge құжаттамасы · тексерілген күні: 12.11.2026. Сілтемелер English тілінде, жаңа бетте ашылады.</p><ul className="hw-list">
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/control_system_intro/The-FTC-Control-System.html" target="_blank" rel="noreferrer">Control System: Autonomous және TeleOp</a></li>
      <li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/RobotAutoDriveByTime_Linear.java" target="_blank" rel="noreferrer">Ресми уақытпен басқару үлгісі · бірнеше мотор қолданады</a></li>
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/myblocks/hardware_example/hardware-example.html" target="_blank" rel="noreferrer">LinearOpMode: opModeIsActive() және sleep()</a></li>
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips/tech-tip-motor-modes/tech-tip-motor-modes.html" target="_blank" rel="noreferrer">Motor Modes және Encoders</a></li>
    </ul></section>
  </div>
}
