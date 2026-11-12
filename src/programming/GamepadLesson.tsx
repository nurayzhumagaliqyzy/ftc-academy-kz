import { useEffect, useRef, useState } from 'react'
import { LessonScenario, PreviousCompletionNotice, LessonCodeExercise, LessonNavigation, LessonQuiz, ReadingSection } from './LessonComponents'
import { GamepadLab } from './GamepadLab'
import {
  gamepadScenario, canCompleteGamepad, gamepadCodeTasks, gamepadCodeScore, gamepadJavaExample, gamepadProgressPercent,
  gamepadQuestions, gamepadQuizPassed, gamepadQuizScore, gamepadReadings, loadGamepadProgress,
  normalizeGamepadProgress, saveGamepadProgress,
} from './gamepadModel'
import type { GamepadProgress, GamepadReadingId } from './gamepadModel'
import './gamepad.css'

export function GamepadLesson() {
  const [progress, setProgress] = useState(loadGamepadProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setStorageAvailable(saveGamepadProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('gamepad-lesson')?.scrollIntoView({ block: 'start' })
  }, [])
  function update(change: (previous: GamepadProgress) => GamepadProgress) {
    setProgress(previous => normalizeGamepadProgress(change(previous)))
  }
  function readingProps(id: GamepadReadingId) {
    const index = gamepadReadings.findIndex(section => section.id === id)
    return { id: 'gl-' + id, title: gamepadReadings[index].title, index: index + 1, read: progress.read.includes(id),
      onRead: () => update(previous => ({ ...previous, read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id] })) }
  }
  function jumpTo(id: string) {
    const target = document.getElementById('gl-' + id)
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' })
  }
  const ready = canCompleteGamepad(progress)
  const percent = gamepadProgressPercent(progress)
  const answered = gamepadQuestions.filter(question => progress.answers[question.id] !== undefined).length
  return <div className="hardware-module programming-lesson gl-lesson" id="gamepad-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 3-САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>Gamepad (ойын контроллері) және TeleOp (оператор басқаратын режим)</h1>
      <p>Екінші сабақта моторға тұрақты қуат бердің. Енді қуатты оператордың әрекетіне қарай өзгертуді үйрен.</p>
      <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 40–50 минут</span></div>
    </div>
    <LessonNavigation current="gamepad-teleop" />
    <section className="hw-panel pl-progress" aria-labelledby="gl-progress">
      <div className="hw-section-head"><h2 id="gl-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span></div>
      <progress className="hw-meter" max={100} value={percent} aria-label="Үшінші сабақтағы прогресс">{percent}%</progress>
      <p>Теория: {progress.read.length}/4 · Lab: {progress.labDone ? 'орындалды' : 'әлі орындалмады'} · Java: {gamepadCodeScore(progress)}/5 · Тест: {gamepadQuizScore(progress)}/5 · Жағдаят: {progress.scenarioAnswer === gamepadScenario.answer ? 'орындалды' : 'әлі орындалмады'}</p>
      <PreviousCompletionNotice show={progress.previouslyCompleted && !progress.completed} />
        <p className="hw-muted" role="status">{storageAvailable ? 'Осы сабақтың прогресі браузерде бөлек сақталады. Алдыңғы сабақтардың нәтижелері сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда осы сабақтағы жаңа прогресс жоғалады.'}</p>
    </section>
    <nav className="pl-jumps" aria-label="Үшінші сабақ бөлімдері">
      {[['controller', 'Теория'], ['lab', 'Gamepad Lab'], ['code-exercise', 'Java тапсырмасы'], ['example', 'Толық Java мысалы'], ['quiz', 'Тест'], ['scenario', 'Жағдаят'], ['completion', 'Аяқтау']].map(([id, label]) => <button type="button" className="hw-button hw-button-secondary" key={id} onClick={() => jumpTo(id)}>{label}</button>)}
    </nav>
    <section className="hw-panel" aria-labelledby="gl-objectives">
      <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p><h2 id="gl-objectives">Оқу мақсаттары</h2>
      <ul className="hw-list">
        <li>Gamepad пен Driver Station (оператор станциясы) қызметін түсінесің.</li>
        <li>TeleOp пен Autonomous (автономды режим) айырмасын ажыратасың.</li>
        <li>Joystick (басқару тетігі) Y мәнінің таңбасын оқып, мотор қуатын есептейсің.</li>
        <li>Gamepad кірісін DC Motor (тұрақты ток қозғалтқышы) қуатымен байланыстыратын Java кодын толықтырасың.</li>
      </ul>
      <p className="pl-outcome"><b>Күтілетін нәтиже:</b> Joystick Y мәнінен мотор қуатын есептеп, таңба мен бағытты түсіндіресің; нөлдік кірістің әсерін анықтайсың.</p>
      <p className="pl-prerequisite">Дайындық: <a className="hw-back" href="#programming/dc-motor">2-сабақтағы setPower() және моторды тоқтатуды қайтала →</a></p>
    </section>
    <ReadingSection {...readingProps('controller')}>
      <p>Gamepad — оператордың қолындағы кіріс құрылғысы. Оның Joystick тетіктері мен батырмалары адамның әрекетін сандық мәнге айналдырады. Ол моторға тікелей қорек бермейді: пәрменді бағдарлама есептейді.</p>
      <p>Gamepad Driver Station құрылғысына қосылады. Driver Station қолданбасында OpMode (роботты басқару бағдарламасы) таңдалып, INIT (дайындау), START (іске қосу) және STOP (тоқтату) пәрмендері беріледі. Контроллердің кірістері байланыс арқылы роботтағы Robot Controller (роботты басқару қолданбасы) бағдарламасына жеткізіледі. Java коды робот жағында орындалады.</p>
      <dl className="hw-facts">
        <div><dt><code>gamepad1</code></dt><dd>Бірінші операторға тағайындалған Gamepad күйі. Мысалы, оны роботтың жүрісін басқаруға қолдануға болады.</dd></div>
        <div><dt><code>gamepad2</code></dt><dd>Екінші операторға тағайындалған Gamepad күйі. Мысалы, оны көтергішке қолдануға болады. Бұл бөлу міндетті емес: қай әрекет нені басқаратынын код анықтайды.</dd></div>
      </dl>
      <p className="hw-note">1 және 2 — мотор не USB порт нөмірі емес, контроллердің тағайындалуы. Нақты сынақ алдында Driver Station-та тиісті Gamepad танылғанын тексер. Бұл сабақтағы код тек <code>gamepad1</code> кірісін оқиды.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('modes')}>
      <p><b>TeleOp</b> кезінде бағдарлама оператордың ағымдағы әрекетіне жауап береді. Мысалы, тетік алға итерілсе, моторға оң қуат беріледі; ортаға қайтса, қуат нөлденеді.</p>
      <p><b>Autonomous</b> кезінде робот тапсырманы алдын ала жазылған логикамен, оператордың үздіксіз Gamepad басқаруынсыз орындайды. Ол сенсор деректерін де пайдалана алады. TeleOp та сенсорларды және автоматты көмекші әрекеттерді қолдана алады.</p>
      <p><code>@TeleOp</code> бағдарлама түрін Driver Station тізімінде белгілейді. Ол Gamepad-ты моторға өздігінен байланыстырмайды: кірісті оқитын және моторға пәрмен беретін кодты өзің жазасың.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('joystick')}>
      <p><code>gamepad1.left_stick_y</code> — бірінші контроллердің сол тетігінің тік ось мәні. Аралығы <b>−1.0…+1.0</b>. Толық алға итеру әдетте −1, орта — шамамен 0, толық артқа тарту +1 береді. Нақты контроллерде ортаға жақын шағын ауытқу және deadzone (орта маңындағы еленбейтін аралық) болуы мүмкін.</p>
      <div className="hw-table-scroll"><table className="hw-table"><caption>Тетік пен қуат арасындағы байланыс</caption><thead><tr><th scope="col">Әрекет</th><th scope="col">left_stick_y</th><th scope="col">power = −Y</th></tr></thead><tbody>
        <tr><td>Алға жартылай</td><td>−0.50</td><td>+0.50</td></tr><tr><td>Орта</td><td>0.00</td><td>0.00</td></tr><tr><td>Артқа жартылай</td><td>+0.50</td><td>−0.50</td></tr>
      </tbody></table></div>
      <p>Минус — таңбаны ауыстыру: <code>−(−0.5) = +0.5</code>. Сондықтан <code>double power = -gamepad1.left_stick_y;</code> алға итеруді оң қуатқа айналдырады. Бұл роботтың міндетті түрде алға жүретінін білдірмейді: нақты қозғалыс мотордың орнатылуына және бағыт баптауына байланысты.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('logic')}>
      <ol className="hw-list"><li><b>Оқу:</b> цикл ішінде <code>gamepad1.left_stick_y</code> мәнін ал.</li><li><b>Есептеу:</b> Y таңбасын өзгертіп, <code>power</code> айнымалысына сақта.</li><li><b>Басқару:</b> <code>motor.setPower(power)</code> арқылы қуатты жаңарт.</li><li><b>Көрсету:</b> <code>telemetry.addData()</code> деректі дайындайды, <code>telemetry.update()</code> оны Driver Station экранына жібереді.</li></ol>
      <p>Бұл әрекеттер <code>while (opModeIsActive())</code> циклінде қайталанады. Егер тетікті циклге дейін бір рет қана оқысаң, кейінгі қозғалыстар ескерілмейді. <code>waitForStart()</code> шақыруынан бұрын қозғалыс пәрменін берме.</p>
      <p className="hw-note">Мотор конфигурациядағы <code>"motor"</code> атауымен дәл сәйкес келсін. Қуаттың жарамды аралығы −1…+1: тетік мәнін 100-ге көбейтпе. <code>setPower(0)</code> жетек қуатын нөлге қояды; теріс қуат тоқтату емес.</p>
    </ReadingSection>
    <GamepadLab done={progress.labDone} onComplete={() => update(previous => ({ ...previous, labDone: true }))} />
    <LessonCodeExercise id="gl-code-exercise" tasks={gamepadCodeTasks} answers={progress.code} onChange={(id, value) => update(previous => ({ ...previous, code: { ...previous.code, [id]: value } }))} />
    <section className="hw-panel" aria-labelledby="gl-example">
      <p className="hw-kicker">ТОЛЫҚ БАҒДАРЛАМА</p><h2 id="gl-example" tabIndex={-1}>GamepadMotor.java · TeleOp мысалы</h2>
      <p>FTC SDK (бағдарламалық әзірлеу жинағы) жобасында <b>GamepadMotor.java</b> файлын қолдан. Конфигурацияда <code>motor</code> атты мотор және бірінші операторға тағайындалған Gamepad қажет.</p>
      <figure className="pl-code-figure"><figcaption>Сол Joystick → бір мотор</figcaption><pre tabIndex={0} aria-label="Gamepad арқылы моторды басқаратын толық Java мысалы"><code lang="en">{gamepadJavaExample}</code></pre></figure>
      <dl className="hw-facts">
        <div><dt><code>import</code>, <code>@TeleOp</code>, <code>extends LinearOpMode</code></dt><dd>SDK типтерін қосады, TeleOp атауын тізімге енгізеді және орындалу құрылымын береді. <code>runOpMode()</code> — бағдарламаның негізгі әдісі.</dd></div>
        <div><dt><code>hardwareMap.get(DcMotor.class, "motor")</code></dt><dd>Конфигурациядағы моторды алады. Атауда бас және кіші әріптер маңызды. <code>private DcMotor motor;</code> осы құрылғыға сілтеме сақтайды.</dd></div>
        <div><dt><code>setPower(0)</code>, <code>setDirection()</code>, <code>setMode()</code>, <code>setZeroPowerBehavior()</code></dt><dd>Бастапқы қуатты нөлдейді; FORWARD бағытын, RUN_WITHOUT_ENCODER режимін және BRAKE нөлдік қуат әрекетін баптайды. BRAKE айналуға кедергі келтіреді, бірақ білікті берілген бұрышта ұстамайды.</dd></div>
        <div><dt><code>waitForStart()</code> және <code>opModeIsActive()</code></dt><dd>START-ты күтеді; OpMode белсенді болғанда ғана циклді жалғастырады. <code>idle()</code> циклде басқа жүйелік жұмысқа кезек береді.</dd></div>
        <div><dt><code>double power = -gamepad1.left_stick_y;</code></dt><dd>Әр айналымда сол тетік мәнінің таңбасын өзгертіп, қуатты есептейді. <code>motor.setPower(power);</code> сол қуатты моторға береді.</dd></div>
        <div><dt><code>telemetry.addData()</code> және <code>telemetry.update()</code></dt><dd>Операторға Y және power мәндерін көрсетеді. Telemetry — деректерді көрсету құралы, моторды басқару пәрмені емес.</dd></div>
        <div><dt><code>{'finally { motor.setPower(0); }'}</code></dt><dd>STOP не ерекше жағдайдан кейін орындалу блогынан шыққанда қуатты нөлге қояды. Қорек жоғалуы сияқты жағдайларды Java коды басқара алмайды.</dd></div>
      </dl>
      <p className="hw-note">Нақты сынақта моторды бекіт, дөңгелектерді жерден көтер және айналатын бөлшектерге жақындама. Тетікті босатқанда және STOP басқанда қуаттың нөл болуын тексер. Нақты білік инерциямен айнала алады. Бұл бет кодты құрастырмайды және роботта орындамайды.</p>
    </section>
    <LessonQuiz id="gl-quiz" questions={gamepadQuestions} answers={progress.answers}
      onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : { ...previous, answers: { ...previous.answers, [id]: answer } })}
      onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))}
      retryNote="Қайта бастағанда тек тест жауаптары мен аяқталу белгісі жаңарады. Теория, Lab, Java тапсырмасы және жағдаят сақталады." />
    <LessonScenario id="gl-scenario" question={gamepadScenario} answer={progress.scenarioAnswer}
      onAnswer={answer => update(previous => previous.scenarioAnswer !== undefined ? previous : { ...previous, scenarioAnswer: answer })}
      onRetry={() => update(previous => ({ ...previous, scenarioAnswer: undefined, completed: false }))} />

    <section className="hw-panel" aria-labelledby="gl-completion">
      <h2 id="gl-completion" tabIndex={-1}>Сабақты аяқтау</h2>
      <ul className="pl-checklist"><li>{progress.read.length === 4 ? '✓' : '○'} Теорияны оқу ({progress.read.length}/4)</li><li>{progress.labDone ? '✓' : '○'} Lab-та екі бағытты байқап, нөлге қайтару</li><li>{gamepadCodeScore(progress) === 5 ? '✓' : '○'} Java тапсырмасы ({gamepadCodeScore(progress)}/5)</li><li>{gamepadQuizPassed(progress) ? '✓' : '○'} Тест: бес сұраққа жауап және кемінде 4/5 ({answered}/5 жауап, {gamepadQuizScore(progress)}/5 дұрыс)</li>  <li>{progress.scenarioAnswer === gamepadScenario.answer ? '✓' : '○'} Қолданбалы жағдаятты дұрыс орындау</li>
        </ul>
      <button type="button" className="hw-button" disabled={!ready || progress.completed} onClick={() => update(previous => ({ ...previous, completed: true }))}>{progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}</button>
      <p role="status">{progress.completed ? 'Жарайсың! Тетік мәнін мотор қуатына айналдыруды меңгердің. Сабаққа қайта оралып, жаттыға аласың.' : 'Аяқтау батырмасы жоғарыдағы бес шарт орындалғанда ашылады.'}</p>
    </section>
    <LessonNavigation current="gamepad-teleop" pager />
    <section className="hw-panel" aria-labelledby="gl-sources"><h2 id="gl-sources">Ресми дереккөздер</h2><p>FIRST Tech Challenge құжаттамасы · тексерілген күні: 12.11.2026. Сілтемелер English тілінде, жаңа бетте ашылады.</p>
      <ul className="hw-list"><li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/onbot_java/creating_op_modes/Creating-and-Running-an-Op-Mode-(OnBot-Java).html" target="_blank" rel="noreferrer">OpMode, Gamepad Y және моторды басқару</a></li><li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/BasicOpMode_Linear.java" target="_blank" rel="noreferrer">Ресми LinearOpMode Java үлгісі</a></li></ul>
    </section>
  </div>
}
