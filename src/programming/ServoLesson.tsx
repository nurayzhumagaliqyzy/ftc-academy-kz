import { useEffect, useRef, useState } from 'react'
import { LessonCodeExercise, LessonNavigation, LessonQuiz, LessonScenario, ReadingSection } from './LessonComponents'
import { ServoLab } from './ServoLab'
import {
  canCompleteServo, loadServoProgress, normalizeServoProgress, saveServoProgress, servoChallenges,
  servoCodeScore, servoCodeTasks, servoJavaExample, servoProgressPercent, servoQuestions,
  servoQuizPassed, servoQuizScore, servoReadings, servoScenario,
} from './servoModel'
import type { ServoProgress, ServoReadingId } from './servoModel'
import './servo.css'

export function ServoLesson() {
  const [progress, setProgress] = useState(loadServoProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setStorageAvailable(saveServoProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('servo-lesson')?.scrollIntoView({ block: 'start' })
  }, [])
  function update(change: (previous: ServoProgress) => ServoProgress) {
    setProgress(previous => normalizeServoProgress(change(previous)))
  }
  function readingProps(id: ServoReadingId) {
    const index = servoReadings.findIndex(section => section.id === id)
    return { id: 'sl-' + id, title: servoReadings[index].title, index: index + 1, read: progress.read.includes(id),
      onRead: () => update(previous => ({ ...previous, read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id] })) }
  }
  function jumpTo(id: string) {
    const target = document.getElementById('sl-' + id)
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' })
  }
  const ready = canCompleteServo(progress)
  const percent = servoProgressPercent(progress)
  const answered = servoQuestions.filter(question => progress.answers[question.id] !== undefined).length
  return <div className="hardware-module programming-lesson sl-lesson" id="servo-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 5-САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>Servo Motor (сервоқозғалтқыш) басқару</h1>
      <p>DC Motor (тұрақты ток қозғалтқышы) қуатын басқаруды білесің. Енді стандартты позициялық Servo-ға нысаналы позиция беріп, робот қысқышының жұмысын жоспарла.</p>
      <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 40–50 минут</span></div>
    </div>
    <LessonNavigation current="servo" />
    <section className="hw-panel pl-progress" aria-labelledby="sl-progress">
      <div className="hw-section-head"><h2 id="sl-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span></div>
      <progress className="hw-meter" max={100} value={percent} aria-label="Бесінші сабақтағы прогресс">{percent}%</progress>
      <p>Теория: {progress.read.length}/4 · Lab: {progress.solved.length}/3 · Java: {servoCodeScore(progress)}/5 · Тест: {servoQuizScore(progress)}/5 · Жағдаят: {progress.scenarioAnswer === servoScenario.answer ? 'орындалды' : 'әлі орындалмады'}</p>
      <p className="hw-muted" role="status">{storageAvailable ? 'Осы сабақтың прогресі браузерде бөлек сақталады. Алдыңғы сабақтардың нәтижелері сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда осы сабақтағы жаңа прогресс жоғалады.'}</p>
    </section>
    <nav className="pl-jumps" aria-label="Бесінші сабақ бөлімдері">
      {[['fundamentals', 'Теория'], ['lab', 'Claw Lab'], ['code-exercise', 'Java тапсырмасы'], ['example', 'Толық Java мысалы'], ['quiz', 'Тест'], ['scenario', 'Жағдаят'], ['completion', 'Аяқтау']].map(([id, label]) => <button type="button" className="hw-button hw-button-secondary" key={id} onClick={() => jumpTo(id)}>{label}</button>)}
    </nav>
    <section className="hw-panel" aria-labelledby="sl-objectives">
      <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p><h2 id="sl-objectives">Оқу мақсаттары</h2>
      <ul className="hw-list"><li>Стандартты позициялық Servo, DC Motor және Continuous Rotation Servo (үздіксіз айналатын Servo, CRServo) айырмасын ажырату.</li><li>Control Hub (басқару блогы) қосылымын, порт пен конфигурация атауының байланысын түсіну.</li><li>0.0…1.0 аралығындағы позицияны таңдап, setPosition() мен getPosition() қызметін түсіндіру.</li><li>Қысқышты басқарудағы қате болжамды тауып, қауіпсіз түзету жолын ұсыну.</li></ul>
      <p className="pl-outcome"><b>Күтілетін нәтиже:</b> үш Claw тапсырмасында позиция мен оның әсерін түсіндіресің; бес Java үзіндісін толықтырасың; нысаналы пәрменді нақты өлшенген орыннан ажыратасың.</p>
      <p className="pl-prerequisite">Дайындық: <a className="hw-back" href="#programming/dc-motor">2-сабақтағы қуат пен бағытты</a> және <a className="hw-back" href="#programming/gamepad-teleop">3-сабақтағы Gamepad (ойын контроллері) кірісін</a> қайтала.</p>
    </section>
    <ReadingSection {...readingProps('fundamentals')}>
      <p>Стандартты позициялық Servo — ішкі басқару тізбегі бар атқарушы құрылғы. Бағдарлама оған нысаналы позиция береді; құрылғы өзінің қолжетімді механикалық жүрісі шегінде соған ұмтылып, жүктеме мүмкіндігі жетсе сол орынды ұстайды. Мысалы, робот қысқышын ашу немесе шағын қақпақты белгілі қалыпқа келтіру үшін ыңғайлы.</p>
      <p>Алдыңғы сабақтағы DC Motor үшін <code>setPower(0.5)</code> қуат пәрмені болды: ол білікті берілген бұрышта ұстамайды. Servo үшін <code>setPosition(0.5)</code> — қалыпталған 0…1 аралығындағы нысаналы позиция. Бұл 50% қуат немесе 50 RPM (минуттағы айналым саны) деген сөз емес.</p>
      <div className="hw-table-scroll"><table className="hw-table"><caption>Басқарылатын шама мен SDK типі</caption><thead><tr><th scope="col">Құрылғы</th><th scope="col">Java пәрмені</th><th scope="col">Мағынасы</th></tr></thead><tbody><tr><td>DC Motor · осы курстағы RUN_WITHOUT_ENCODER</td><td><code>DcMotor.setPower(-1…1)</code></td><td>Жетек қуаты мен логикалық бағыт</td></tr><tr><td>Стандартты позициялық Servo</td><td><code>Servo.setPosition(0…1)</code></td><td>Нысаналы позиция</td></tr><tr><td>Continuous Rotation Servo</td><td><code>CRServo.setPower(-1…1)</code></td><td>Үздіксіз айналу қуаты мен бағыты; нысаналы бұрыш емес</td></tr></tbody></table></div>
      <p>CRServo сырттай стандартты Servo-ға ұқсас болуы мүмкін. Кейбір құрылғыда режимді өндіруші құралымен ауыстыруға болады. Құрылғының нақты режимін нұсқаулығынан тексер: Java типін ауыстыру механикалық Servo-ны өздігінен басқа режимге өткізбейді.</p>
      <p className="hw-note">Барлық Servo бірдей бұрышқа бұрылмайды. Механикалық жүріс Servo моделіне, оның баптауына, SDK позиция диапазонына және механизмге тәуелді. <code>0.5</code> барлық құрылғыда дәл 90° деген кепілдік емес. <code>0.0</code> әрқашан «жабық», <code>1.0</code> әрқашан «ашық» болмайды.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('connection')}>
      <p>Control Hub-та стандартты үш сымды Servo қосқышына арналған алты порт бар: 0–5. Кабельде signal (басқару сигналы), power (қорек) және ground (жер, GND) желілері болады. PWM (импульс енін модуляциялау) сигналы нысаналы күй туралы ақпарат береді. Servo-ны DC Motor портына жалғама.</p>
      <ol className="hw-list"><li>Робот қорегін ажырат. Қысқыш маңын босат; саусақ пен сымды қозғалатын бөліктерден алыстат.</li><li>Servo кабелін Hub-тағы <b>Servo 0</b> портына жалға. Ground сымы порттағы GND белгісіне сәйкес келсін. Тек кабель түсіне сенбей, өндірушінің pinout (түйіспелер сызбасы) нұсқаулығын тексер.</li><li>Қоректі қосып, Driver Station (оператор станциясы) қолданбасында робот конфигурациясын аш. Дұрыс Hub ішіндегі <b>Servos</b> бөлімінде 0-порт үшін стандартты <b>Servo</b> типін таңда.</li><li>Құрылғы атауын <code>claw</code> деп қой; конфигурацияны сақтап, белсенді ет. Кодтағы <code>"claw"</code> осы атаумен дәл сәйкес болуы керек.</li><li>Алғашқы тексеруді жүктемесіз, шағын позиция өзгерістерімен жаса. Нақты ашық/жабық мәндерді жазып ал; тірелген шетке күштеме.</li></ol>
      <p><b>Порт пен атау бір нәрсе емес:</b> физикалық кабель 0-портқа кіреді, ал бағдарлама <code>hardwareMap.get(Servo.class, "claw")</code> арқылы конфигурациядағы атауды іздейді. Атауды тек кодта өзгерту жеткіліксіз. Құрылғы табылмаса, кабель, таңдалған Hub, тип және атауды ретімен тексер.</p>
      <p className="hw-note">Бір Servo-ға позиция пәрмені берілгенде Hub-тағы өзге жалғанған Servo-лар да белсенді болуы мүмкін. Сынақ алдында олардың да еркін қозғала алатынын тексер. Қорек пен жүктеме шектеулерін өндірушінің нұсқаулығынан қара.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('sdk')}>
      <p>FTC SDK (бағдарламалық әзірлеу жинағы) ішінде <code>Servo</code> типі стандартты позициялық Servo әдістерін береді. <code>import com.qualcomm.robotcore.hardware.Servo;</code> импортынан кейін <code>private Servo claw;</code> құрылғыға сілтеме сақтайды. <code>hardwareMap.get(Servo.class, "claw")</code> конфигурациядағы құрылғыны осы сілтемеге тағайындайды.</p>
      <dl className="hw-facts"><div><dt><code>claw.setPosition(0.25);</code></dt><dd>0.25 нысаналы позициясына баруды сұрайды. Қозғалыстың жылдамдығын не аяқталуын осы жол анықтамайды. Әдіс шақырылғаннан кейінгі келесі Java жолы Servo нысанаға жеткенін күтпейді.</dd></div><div><dt><code>claw.getPosition()</code></dt><dd>Соңғы берілген нысаналы позицияны қайтарады. Білік кептелсе де пәрмен мәні өзгермеуі мүмкін. Бұл Sensor (датчик) өлшеген нақты бұрыш емес.</dd></div><div><dt><code>waitForStart()</code></dt><dd>START сигналын күтеді. <code>isStopRequested()</code> тоқтату сұрауын тексереді; <code>opModeIsActive()</code> белсенді OpMode (роботты басқару бағдарламасы) циклін шектейді.</dd></div></dl>
      <p>Java-да ондық бөлшек нүктемен жазылады: <code>0.25</code>. Өзгермелі есептеуді 0…1 шегінде ұста. Мысалы, <code>double target = Math.max(0.0, Math.min(1.0, requested));</code> сандық шектен асуды тежейді. Бірақ осы аралықтың бәрі нақты механизм үшін қауіпсіз деген сөз емес: қауіпсіз ішкі аралықты тәжірибемен анықтау керек.</p>
      <p>Позицияны <code>telemetry.addData("Commanded position", claw.getPosition());</code> арқылы Driver Station экранына дайындап, <code>telemetry.update();</code> арқылы жібер. Көрсеткішті «нақты бұрыш» деп атама: ол тек пәрменді көрсетеді.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('practice')}>
      <p>Claw (қысқыш) затты ұстауға, latch (ілмек) бөлшекті бекітуге, ал шағын gate (қақпақ) заттың өтуін реттеуге көмектеседі. Бір Servo екі жақты механикалық байланыс арқылы қозғалта алады. Төмендегі Lab осы байланысты тек көрнекі көрсетеді; тісті беріліс, күш, соқтығысу не затты ұстау физикасы есептелмейді.</p>
      <p><b>Болжа → шағын қадам жаса → бақыла → түсіндір.</b> Алдымен өндіруші сипаттамасын тексер. Механизмнің жүктемесі мен бастапқы орнына сай қауіпсіз мәнді анықта; ортаны автоматты түрде қауіпсіз деп қабылдама. Жақ тірелсе, дірілдесе немесе Servo қызса, STOP беріп, қоректі ажыратқан соң механизмді тексер. Қуат қосулы кезде білікті қолмен күштеп бұрама.</p>
      <ul className="hw-list"><li><b>Қозғалмайды:</b> конфигурациядағы атау мен типті, порт пен кабельді, START күйін тексер.</li><li><b>Ашылудың орнына жабылады:</b> нақты механизмнің тексерілген ашық/жабық мәндерін қолдан. <code>setDirection(Servo.Direction.REVERSE)</code> логикалық сәйкестікті кері аудара алады, бірақ оны сандарды ойланбай ауыстыруға қоспа; қайта калибрлеу қажет.</li><li><b>Код «жетті» дейді, бірақ жақ кептелген:</b> <code>getPosition()</code> соңғы пәрменді ғана көрсетеді. Қозғалысты бөлек бақылау не тиісті кері байланыс керек.</li><li><b>Тоқтату үшін 0 берілген:</b> <code>setPosition(0)</code> шетке қозғалу пәрмені. Servo үшін DC Motor-дағы <code>setPower(0)</code> тәсілін қайталама.</li></ul>
      <p className="hw-note">Мысалдың соңына <code>{'finally { claw.setPosition(0); }'}</code> жазу әмбебап қауіпсіз тазалау емес: ол механизмді қауіпті шетке жылжытуы мүмкін. Қауіпсіз соңғы күй механизмге арнайы жобаланады. STOP, қорек ажырауы және жүктеменің салбырауы сияқты жағдайлар нақты роботта бөлек тексеріледі.</p>
    </ReadingSection>
    <ServoLab solved={progress.solved} onSolve={id => update(previous => ({ ...previous, solved: [...previous.solved, id] }))}
      onRetry={() => update(previous => ({ ...previous, solved: [], completed: false }))} />
    <LessonCodeExercise id="sl-code-exercise" title="Servo кодын толықтыр" tasks={servoCodeTasks} answers={progress.code} onChange={(id, value) => update(previous => ({ ...previous, code: { ...previous.code, [id]: value } }))} />
    <section className="hw-panel" aria-labelledby="sl-example">
      <p className="hw-kicker">ТОЛЫҚ БАҒДАРЛАМА</p><h2 id="sl-example" tabIndex={-1}>ServoClaw.java · бір стандартты Servo</h2>
      <p>FTC SDK жобасының TeamCode модулінде <b>ServoClaw.java</b> файлын қолдан. Конфигурацияда <code>claw</code> атты стандартты позициялық Servo қажет. Бұл — TeleOp (оператор басқаратын режим) мысалы: START-тан кейін 0.50 беріледі, A басылса 0.75, B басылса 0.25 беріледі; екеуі бірге басылса A басым. Батырмалар жіберілсе соңғы пәрмен сақталады.</p>
      <p className="hw-note">0.25, 0.50 және 0.75 — үлгілік мәндер. Кодты нақты роботта іске қоспас бұрын оларды өз механизмің үшін тексерілген мәндермен ауыстыр. INIT кезінде қозғалыс пәрмені берілмейді; START кезінде бастапқы 0.50-ге қозғалу да мүмкін.</p>
      <figure className="pl-code-figure"><figcaption>Gamepad A/B → Servo позициясы</figcaption><pre tabIndex={0} aria-label="Бір Servo-ға арналған толық Java мысалы"><code lang="en">{servoJavaExample}</code></pre></figure>
      <dl className="hw-facts"><div><dt><code>package</code> және үш <code>import</code></dt><dd>Кодты TeamCode пакетіне орналастырады; LinearOpMode, TeleOp және Servo SDK типтерін қосады.</dd></div><div><dt><code>@TeleOp</code>, <code>extends LinearOpMode</code>, <code>runOpMode()</code></dt><dd>Бағдарламаны Driver Station тізіміне енгізеді және орындалу құрылымын береді. Файл мен public class атауы ServoClaw болуы керек.</dd></div><div><dt><code>hardwareMap.get(Servo.class, "claw")</code></dt><dd>Стандартты Servo-ны конфигурациядағы атаумен алады. Алғашқы telemetry жолдары қозғалыссыз дайындық күйін көрсетеді.</dd></div><div><dt><code>waitForStart(); if (isStopRequested()) return;</code></dt><dd>START күтеді; күту кезінде STOP сұралса, позиция берместен шығады.</dd></div><div><dt><code>setPosition(0.50)</code> және белсенді цикл</dt><dd>Тексерілген бастапқы позицияға пәрмен береді. Цикл ішінде A/B ағымдағы күйі оқылып, 0.75/0.25 таңдалады; батырма жоқта жаңа позиция берілмейді.</dd></div><div><dt><code>getPosition()</code>, <code>telemetry.update()</code>, <code>idle()</code></dt><dd>Соңғы нысаналы пәрменді көрсетеді және басқа жүйелік жұмысқа кезек береді. Бұл Servo қозғалысының аяқталғанын тексеретін цикл емес.</dd></div></dl>
      <p>Бұл бет Java кодын құрастырмайды және роботқа жүктемейді. Мысалда әмбебап «жабық» не «қауіпсіз» позиция жорамалданбайды; STOP кезінде 0 позициясына қосымша қозғалыс пәрмені берілмейді.</p>
    </section>
    <LessonQuiz id="sl-quiz" questions={servoQuestions} answers={progress.answers}
      onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : { ...previous, answers: { ...previous.answers, [id]: answer } })}
      onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))}
      retryNote="Қайта бастағанда тек тест жауаптары мен аяқталу белгісі жаңарады. Теория, Lab, Java және жағдаят сақталады." />
    <LessonScenario id="sl-scenario" question={servoScenario} answer={progress.scenarioAnswer}
      onAnswer={answer => update(previous => previous.scenarioAnswer !== undefined ? previous : { ...previous, scenarioAnswer: answer })}
      onRetry={() => update(previous => ({ ...previous, scenarioAnswer: undefined, completed: false }))} />
    <section className="hw-panel" aria-labelledby="sl-completion">
      <h2 id="sl-completion" tabIndex={-1}>Сабақты аяқтау</h2>
      <ul className="pl-checklist"><li>{progress.read.length === 4 ? '✓' : '○'} Теорияны оқу ({progress.read.length}/4)</li><li>{progress.solved.length === 3 ? '✓' : '○'} Claw Lab: позиция мен түсіндірме ({progress.solved.length}/3)</li><li>{servoCodeScore(progress) === 5 ? '✓' : '○'} Java тапсырмасы ({servoCodeScore(progress)}/5)</li><li>{servoQuizPassed(progress) ? '✓' : '○'} Тест: бес жауап және кемінде 4/5 ({answered}/5 жауап, {servoQuizScore(progress)}/5 дұрыс)</li><li>{progress.scenarioAnswer === servoScenario.answer ? '✓' : '○'} Жағдаятты дұрыс шешу</li></ul>
      <button type="button" className="hw-button" disabled={!ready || progress.completed} onClick={() => update(previous => ({ ...previous, completed: true }))}>{progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}</button>
      <p role="status">{progress.completed ? 'Жарайсың! Servo позициясын беруді және пәрменнің шектеулерін түсіндірдің. Қайта оралып жаттыға аласың.' : 'Аяқтау батырмасы жоғарыдағы бес шарт орындалғанда ашылады.'}</p>
    </section>
    <LessonNavigation current="servo" pager />
    <section className="hw-panel" aria-labelledby="sl-sources"><h2 id="sl-sources">Ресми дереккөздер</h2><p>FIRST Tech Challenge және FTC SDK материалдары · тексерілген күні: 15.11.2026. English тілінде, жаңа бетте ашылады.</p>
      <ul className="hw-list"><li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/android_studio/controlling_a_servo/Controlling-a-Servo-%28Android-Studio%29.html" target="_blank" rel="noreferrer">FIRST: Controlling a Servo — позиция және Gamepad</a></li><li><a href="https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/connecting_devices/connecting_servo/connecting-servo.html" target="_blank" rel="noreferrer">FIRST: Connecting a Servo to the Hub</a></li><li><a href="https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/configuring/configuring_servo/configuring-servo.html" target="_blank" rel="noreferrer">FIRST: Configuring a Servo</a></li><li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/ConceptScanServo.java" target="_blank" rel="noreferrer">FIRST: ConceptScanServo.java — LinearOpMode үлгісі</a></li><li><a href="https://javadoc.io/doc/org.firstinspires.ftc/RobotCore/latest/com/qualcomm/robotcore/hardware/Servo.html" target="_blank" rel="noreferrer">FTC SDK: Servo API — setPosition/getPosition</a></li></ul>
    </section>
  </div>
}
