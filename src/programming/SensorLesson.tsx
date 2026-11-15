import { useEffect, useRef, useState } from 'react'
import { LessonCodeExercise, LessonNavigation, LessonQuiz, LessonScenario, ReadingSection } from './LessonComponents'
import { SensorLab } from './SensorLab'
import {
  canCompleteSensor, loadSensorProgress, normalizeSensorProgress, saveSensorProgress,
  sensorCodeScore, sensorCodeTasks, sensorJavaExample, sensorProgressPercent, sensorQuestions,
  sensorQuizPassed, sensorQuizScore, sensorReadings, sensorScenario,
} from './sensorModel'
import type { SensorProgress, SensorReadingId } from './sensorModel'
import './sensor.css'

export function SensorLesson() {
  const [progress, setProgress] = useState(loadSensorProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setStorageAvailable(saveSensorProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('sensor-lesson')?.scrollIntoView({ block: 'start' })
  }, [])
  function update(change: (previous: SensorProgress) => SensorProgress) {
    setProgress(previous => normalizeSensorProgress(change(previous)))
  }
  function readingProps(id: SensorReadingId) {
    const index = sensorReadings.findIndex(section => section.id === id)
    return { id: 'sn-' + id, title: sensorReadings[index].title, index: index + 1, read: progress.read.includes(id),
      onRead: () => update(previous => ({ ...previous, read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id] })) }
  }
  function jumpTo(id: string) {
    const target = document.getElementById('sn-' + id)
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' })
  }
  const ready = canCompleteSensor(progress)
  const percent = sensorProgressPercent(progress)
  const answered = sensorQuestions.filter(question => progress.answers[question.id] !== undefined).length
  return <div className="hardware-module programming-lesson sn-lesson" id="sensor-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 6-САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>Sensor (датчик) және шартты операторлар</h1>
      <p>Мотор мен Servo-ға пәрмен беруді білесің. Енді өлшенген қашықтықты оқып, if/else (шартқа қарай тармақталу) арқылы мотор пәрменін таңда.</p>
      <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 40–50 минут</span></div>
    </div>
    <LessonNavigation current="sensors" />
    <section className="hw-panel pl-progress" aria-labelledby="sn-progress">
      <div className="hw-section-head"><h2 id="sn-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span></div>
      <progress className="hw-meter" max={100} value={percent} aria-label="Алтыншы сабақтағы прогресс">{percent}%</progress>
      <p>Теория: {progress.read.length}/4 · Lab: {progress.solved.length}/3 · Java: {sensorCodeScore(progress)}/5 · Тест: {sensorQuizScore(progress)}/5 · Жағдаят: {progress.scenarioAnswer === sensorScenario.answer ? 'орындалды' : 'әлі орындалмады'}</p>
      <p className="hw-muted" role="status">{storageAvailable ? 'Осы сабақтың прогресі браузерде бөлек сақталады. Алдыңғы бес сабақтың нәтижелері сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда осы сабақтағы жаңа прогресс жоғалады.'}</p>
    </section>
    <nav className="pl-jumps" aria-label="Алтыншы сабақ бөлімдері">{[['feedback', 'Теория'], ['lab', 'Obstacle Lab'], ['code-exercise', 'Java тапсырмасы'], ['example', 'Толық Java мысалы'], ['quiz', 'Тест'], ['scenario', 'Жағдаят'], ['completion', 'Аяқтау']].map(([id, label]) => <button type="button" className="hw-button hw-button-secondary" key={id} onClick={() => jumpTo(id)}>{label}</button>)}</nav>
    <section className="hw-panel" aria-labelledby="sn-objectives">
      <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p><h2 id="sn-objectives">Оқу мақсаттары</h2>
      <ul className="hw-list"><li>Sensor мен actuator (атқарушы құрылғы) қызметін ажыратып, feedback (кері байланыс) мағынасын түсіну.</li><li>REV 2m Distance Sensor (қашықтық датчигі) үшін I2C қосылымын және конфигурация атауын анықтау.</li><li>Сантиметрмен өлшем оқып, Double.isFinite(), if/else және &lt;= арқылы мотор пәрменін таңдау.</li><li>Жақын кедергі, дәл шектегі мән және жарамсыз көрсеткішті түсіндіріп, бағдарламалық қатені түзету.</li></ul>
      <p className="pl-outcome"><b>Күтілетін нәтиже:</b> 15 см, 20 см және NaN үшін дұрыс пәрмен мен себебін таңдайсың; бес Java үзіндісін толықтырасың; өлшемді, пәрменді және нақты физикалық тоқтауды ажыратасың.</p>
      <p className="pl-prerequisite">Дайындық: <a className="hw-back" href="#programming/dc-motor">2-сабақтағы setPower()</a>, <a className="hw-back" href="#programming/gamepad-teleop">3-сабақтағы басқару циклі</a> және <a className="hw-back" href="#programming/servo">5-сабақтағы пәрмен мен өлшенген орын айырмасы</a>.</p>
    </section>
    <ReadingSection {...readingProps('feedback')}>
      <p>Sensor қоршаған орта не механизм күйі туралы дерек береді. Actuator бағдарлама пәрменін физикалық әрекетке айналдырады: мысалы, DC Motor (тұрақты ток қозғалтқышы) білікті айналдырады, Servo Motor (сервоқозғалтқыш) нысаналы позицияға ұмтылады. Датчик моторды өзі қоректендірмейді және оның орнына шешім қабылдамайды.</p>
      <p>Feedback бар басқаруда бағдарлама <b>өлшейді → шешім қабылдайды → пәрмен береді → қайта өлшейді</b>. Алдыңғы сабақта Servo.getPosition() соңғы пәрменді ғана көрсеткен. Distance Sensor сыртқы нысанаға дейінгі қашықтықты өлшеуге арналған; бұл жаңа ақпаратқа сүйеніп пәрменді өзгертуге мүмкіндік береді.</p>
      <p>Мысалы, робот алдында нысана бар-жоғын байқайды; қысқыш маңына зат келгенін тексереді; белгілі қашықтыққа жақындағанда мотор қуатын нөлдейді. Осы сабақта <b>REV 2m Distance Sensor, REV-31-1505</b> моделін қарастырамыз. Ол optical Time-of-Flight (жарықтың ұшып қайту уақыты) қағидасын қолданады. Оны ultrasonic (ультрадыбыстық) датчикпен немесе REV Color-Distance Sensor-мен шатастырма.</p>
      <p>Өлшем мінсіз болмайды. Мөлдір не шағын нысана, жарықтың шағылу ерекшелігі, сыртқы infrared (инфрақызыл) сәуле және датчиктің орналасуы нәтиже сапасына ықпал етеді. Датчиктің көру аймағынан тыс кедергі байқалмауы мүмкін. Бір ақырлы санның алынуы оның міндетті түрде дәл екенін білдірмейді.</p>
      <p className="hw-note">«2m» атауы кез келген жағдайда дәл 200 см өлшейді деген кепілдік емес. Өндіруші сипаттамасындағы 5–200 см диапазоны режим мен жағдайға тәуелді; FTC Robot Controller әдепкі профильді қолданады. Төмендегі 5–100 см оқу слайдері нақты датчиктің толық жұмыс диапазонын бейнелемейді.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('connection')}>
      <p>Осы нұсқаулық тек REV 2m Distance Sensor (REV-31-1505) үшін. Ол Control Hub (басқару блогы) құрылғысына <b>JST PH 4-pin Sensor Cable</b> арқылы <b>I2C bus 1</b> портымен қосылады. I2C (датчикпен дерек алмасу шинасы) кабелінде қорек, жер және екі байланыс желісі бар. Бұл Servo не DC Motor порты емес; Digital/Analog портына жалғама.</p>
      <ol className="hw-list"><li>Робот қорегін ажырат. Датчик пен кабельдің нақты моделін, қосқыштың кілтін және pinout (түйіспе сызбасын) тексер.</li><li>4-pin кабельдің бір ұшын REV 2m Distance Sensor-ға, екінші ұшын Control Hub-тағы <b>I2C 1</b> портына жалға. Қосқышты күшпен салма.</li><li>Қоректі қосып, Driver Station (оператор станциясы) арқылы робот конфигурациясын аш. Дұрыс Hub ішінен <b>I2C Bus 1 → Add → REV 2M Distance Sensor</b> таңда.</li><li>Құрылғы атауын <code>distance</code> деп қой. Конфигурацияны сақтап, белсенді ет. Бір мотор мысалы үшін Motor портына жалғанған мотор да конфигурацияда <code>motor</code> деп аталсын.</li><li>Қозғалыссыз сынақта алдына мөлдір емес, тұтас ашық түсті нысана қойып, telemetry (операторға көрсетілетін дерек) арқылы өлшемнің өзгеруін бақыла.</li></ol>
      <p><b>Үш бөлек ұғым бар:</b> физикалық датчик — қолыңдағы құрылғы; конфигурациядағы <code>"distance"</code> — құрылғының сақталған атауы; Java-дағы <code>sensor</code> — сол құрылғыға сілтеме сақтайтын айнымалы. <code>hardwareMap.get(DistanceSensor.class, "distance")</code> осы атаумен іздейді, айнымалыны жариялау жаңа физикалық датчик жасамайды.</p>
      <p className="hw-note">Өндіруші мысалында да I2C bus 1 қолданылады. REV Color Sensor V3 пен REV 2m Distance Sensor бір I2C адресін қолданады: оларды бір шинаға бірге қоспа. Бұл сабақта бір датчик жеке I2C 1 портына жалғанады; басқа модельге осы конфигурация түрін көшірме.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('conditions')}>
      <p><code>DistanceSensor</code> — FTC SDK (бағдарламалық әзірлеу жинағы) қашықтық оқу типі. Оны <code>com.qualcomm.robotcore.hardware.DistanceSensor</code> пакетінен импорттаймыз. <code>DistanceUnit</code> типінің пакеті — <code>org.firstinspires.ftc.robotcore.external.navigation</code>.</p>
      <figure className="pl-code-figure"><figcaption>Өлшем мен шек бірдей бірлікте</figcaption><pre tabIndex={0}><code lang="en">{'double stopDistanceCm = 20.0;\ndouble distanceCm = sensor.getDistance(DistanceUnit.CM);'}</code></pre></figure>
      <p><code>double</code> бөлшек санды сақтайды; Java-да ондық бөлшек нүктемен жазылады. <code>DistanceUnit.CM</code> нәтижені сантиметрмен сұрайды. <code>distanceCm</code> — датчик көрсеткіші, <code>stopDistanceCm</code> — бағдарламашы таңдаған шек. Мысалы, 20 см = 200 мм; сантиметр көрсеткішін миллиметр шегімен тікелей салыстыру — қате.</p>
      <div className="hw-table-scroll"><table className="hw-table"><caption>Шартты жазу</caption><thead><tr><th scope="col">Java</th><th scope="col">Мағынасы</th><th scope="col">20 және 20 үшін</th></tr></thead><tbody><tr><td><code>&lt;</code></td><td>Кіші</td><td>false</td></tr><tr><td><code>&lt;=</code></td><td>Кіші немесе тең</td><td>true</td></tr><tr><td><code>&gt;</code></td><td>Үлкен</td><td>false</td></tr><tr><td><code>==</code></td><td>Теңдігін салыстыру</td><td>true</td></tr><tr><td><code>=</code></td><td>Айнымалыға мән тағайындау</td><td>Салыстыру операторы емес</td></tr></tbody></table></div>
      <p><code>if</code> шарты <code>true</code> болса бірінші блок, әйтпесе <code>else</code> блогы орындалады. <code>||</code> — «немесе», <code>!</code> — логикалық терістеу. <code>Double.isFinite(distanceCm)</code> ақырлы сан үшін true, ал <code>NaN</code> не <code>Infinity</code> үшін false қайтарады. Double Java-ның java.lang пакетінде болғандықтан бөлек импорт керек емес.</p>
      <p className="hw-note">NaN — Not a Number (сан емес). <code>NaN &lt;= 20</code> — false; <code>NaN == Double.NaN</code> да false. Сондықтан тек қашықтықты салыстыру жеткіліксіз: алдымен санның жарамдылығын тексер. isFinite() ақырлылықты ғана тексереді, сенсордың дәлдігін не оның физикалық диапазонына сәйкестігін растамайды.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('obstacle')}>
      <p>Басқару цикліне төрт қадам енгіз: <b>өлшемді оқы; ақырлы сан екенін тексер; шекпен салыстыр; моторға пәрмен бер.</b> Бір рет оқып қойған мәнді цикл сайын қайта қолдансаң, жаңа кедергі ескерілмейді. Сондықтан әр <code>while (opModeIsActive())</code> айналымында жаңа <code>distanceCm</code> оқылады.</p>
      <figure className="pl-code-figure"><figcaption>Кіріспе басқару логикасы</figcaption><pre tabIndex={0}><code lang="en">{'if (!Double.isFinite(distanceCm) || distanceCm <= stopDistanceCm) {\n    motor.setPower(0);\n} else {\n    motor.setPower(0.3);\n}'}</code></pre></figure>
      <p>Шек 20 см болса, 15 см де, дәл 20 см де нөлдік қуат пәрменін береді. 35 см — ақырлы және шектен үлкен, сондықтан 0.3 беріледі. NaN кезінде бірінші шарт true: осы кіріспе мысалда fail-safe (белгісіз дерекке сақтық жауабы) ретінде нөл таңдалады. Нақты REV драйвері қате түріне қарай басқа шеткі мән не exception (ерекше жағдай) беруі де мүмкін; NaN — Lab-та әдейі жасалған жарамсыз дерек.</p>
      <dl className="hw-facts"><div><dt>Датчик дерегі</dt><dd>Қашықтық туралы көрсеткіш. Ол кедергінің нақты орнына жуық болуы мүмкін және кейде сенімсіз болады.</dd></div><div><dt>Мотор пәрмені</dt><dd><code>setPower(0)</code> не <code>setPower(0.3)</code>. Бұл жетекке берілетін пәрмен, нақты жылдамдық өлшемі емес.</dd></div><div><dt>Нақты тоқтау</dt><dd>Жылдамдық, масса, инерция, сырғанау, мотордың нөлдік қуат әрекеті және оқудан пәрменге дейінгі кідіріске тәуелді. 20 см шек нақты 20 см-де тоқтауды кепілдемейді.</dd></div></dl>
      <p>Нысана шек маңында тұрса, өлшем ауытқуы пәрменді 0 және 0.3 арасында жиі ауыстыруы мүмкін. Нақты жүйеде сүзгілеу, hysteresis (қосу мен тоқтатуға бөлек шектер), жарамды физикалық диапазонды тексеру және ақауды тіркеу қажет болуы мүмкін. Бұлар осы қарапайым Lab-та есептелмейді.</p>
      <p className="hw-note">Бұл бір мотордың логикасын үйретеді; толық Drivetrain (роботтың жүріс жүйесі) контроллері немесе Autonomous (автономды режим) соқтығысудан қорғау жүйесі емес. Нақты сынақты моторды бекітіп, жүріс дөңгелектерін жерден көтеріп, мұғалім бақылауымен жаса. Қауіп байқалса Driver Station-та STOP бер; механизмді қолмен тексерерде қоректі ажырат.</p>
    </ReadingSection>
    <SensorLab solved={progress.solved} onSolve={id => update(previous => ({ ...previous, solved: [...previous.solved, id] }))} onRetry={() => update(previous => ({ ...previous, solved: [], completed: false }))} />
    <LessonCodeExercise id="sn-code-exercise" title="Distance Sensor кодын толықтыр" tasks={sensorCodeTasks} answers={progress.code} onChange={(id, value) => update(previous => ({ ...previous, code: { ...previous.code, [id]: value } }))} />
    <section className="hw-panel" aria-labelledby="sn-example">
      <p className="hw-kicker">ТОЛЫҚ БАҒДАРЛАМА</p><h2 id="sn-example" tabIndex={-1}>DistanceMotor.java · бір моторлы оқу мысалы</h2>
      <p>FTC SDK жобасының TeamCode модуліндегі файл атауы <b>DistanceMotor.java</b> болсын. Конфигурация: <code>motor</code> атты бекітілген DC Motor; I2C 1 портындағы REV 2m Distance Sensor — <code>distance</code>. TeleOp (оператор басқаратын режим) ретінде тізімге тіркеледі, бірақ бұл үлгі Gamepad оқымайды: START-тан кейін датчик шартына қарай бір моторға пәрмен береді.</p>
      <p className="hw-note">INIT кезінде қуат нөл. START-тан кейін ақырлы көрсеткіш 20 см-ден үлкен болса, моторға 0.3 бірден берілуі мүмкін. Бір мотор мысалы толық роботтың алға жүретінін білдірмейді. 20 см — оқу шегі; нақты қауіпсіз тоқтау қашықтығы ретінде қолданба.</p>
      <figure className="pl-code-figure"><figcaption>DistanceSensor → if/else → бір DC Motor</figcaption><pre tabIndex={0} aria-label="Қашықтық бойынша бір моторды басқаратын толық Java мысалы"><code lang="en">{sensorJavaExample}</code></pre></figure>
      <dl className="hw-facts"><div><dt>Пакет, импорттар және <code>@TeleOp</code></dt><dd>TeamCode класын тіркейді; LinearOpMode, DcMotor, DcMotorSimple, DistanceSensor және DistanceUnit типтерін қосады.</dd></div><div><dt><code>hardwareMap.get()</code> және бастапқы қуат</dt><dd>Мотор алынып, бірден нөлдік қуат беріледі. Датчик try блогында алынады: оны баптау не кейінгі оқу кезінде exception туындаса, finally нөлдік қуатты қайта береді.</dd></div><div><dt><code>FORWARD</code>, <code>RUN_WITHOUT_ENCODER</code>, <code>BRAKE</code></dt><dd>Логикалық бағыт пен басқару режимін баптайды. BRAKE нөлдік қуатта айналуға кедергі жасайды; нақты тоқтау орнына кепілдік бермейді.</dd></div><div><dt><code>waitForStart()</code> және <code>opModeIsActive()</code></dt><dd>START-ты күтеді; OpMode (роботты басқару бағдарламасы) белсенді болса ғана өлшем оқып, пәрмен береді. START күту кезінде STOP сұралса, цикл орындалмайды.</dd></div><div><dt>Өлшем, <code>Double.isFinite()</code> және <code>if/else</code></dt><dd>Әр циклде сантиметрмен жаңа мән оқылады. Жарамсыз сан не ≤20 см көрсеткіші нөлдік қуатқа, қалған ақырлы мән 0.3 қуатқа әкеледі.</dd></div><div><dt><code>telemetry</code> және <code>idle()</code></dt><dd>Өлшемді, ақырлылық белгісін, шекті және берілген қуатты Driver Station экранына шығарады; циклде басқа жүйелік жұмысқа кезек береді. getPower() нақты жылдамдықты өлшемейді.</dd></div><div><dt><code>{'finally { motor.setPower(0); }'}</code></dt><dd>try блогынан STOP не ерекше жағдай арқылы шыққанда жетек қуатын нөлдейді. Қорек жоғалуын немесе барлық аппараттық ақауды Java коды кепілдікпен басқара алмайды.</dd></div></dl>
      <p>Бұл веб-бет Java-ны құрастырмайды және роботқа жүктемейді. Мысал ресми FTC API үлгілерімен салыстырылған; толық FTC SDK компиляциясы орындалды деп есептелмейді.</p>
    </section>
    <LessonQuiz id="sn-quiz" questions={sensorQuestions} answers={progress.answers}
      onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : { ...previous, answers: { ...previous.answers, [id]: answer } })}
      onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))} retryNote="Қайта бастағанда тек тест жауаптары мен аяқталу белгісі жаңарады. Теория, Lab, Java және жағдаят сақталады." />
    <LessonScenario id="sn-scenario" question={sensorScenario} answer={progress.scenarioAnswer}
      onAnswer={answer => update(previous => previous.scenarioAnswer !== undefined ? previous : { ...previous, scenarioAnswer: answer })}
      onRetry={() => update(previous => ({ ...previous, scenarioAnswer: undefined, completed: false }))} />
    <section className="hw-panel" aria-labelledby="sn-completion">
      <h2 id="sn-completion" tabIndex={-1}>Сабақты аяқтау</h2><ul className="pl-checklist"><li>{progress.read.length === 4 ? '✓' : '○'} Теорияны оқу ({progress.read.length}/4)</li><li>{progress.solved.length === 3 ? '✓' : '○'} Lab: үш пәрмен мен түсіндірме ({progress.solved.length}/3)</li><li>{sensorCodeScore(progress) === 5 ? '✓' : '○'} Java тапсырмасы ({sensorCodeScore(progress)}/5)</li><li>{sensorQuizPassed(progress) ? '✓' : '○'} Тест: бес жауап және кемінде 4/5 ({answered}/5 жауап, {sensorQuizScore(progress)}/5 дұрыс)</li><li>{progress.scenarioAnswer === sensorScenario.answer ? '✓' : '○'} Диагностикалық жағдаятты дұрыс шешу</li></ul>
      <button type="button" className="hw-button" disabled={!ready || progress.completed} onClick={() => update(previous => ({ ...previous, completed: true }))}>{progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}</button>
      <p role="status">{progress.completed ? 'Жарайсың! Өлшемді тексеріп, шарт арқылы мотор пәрменін таңдадың. Қайта оралып жаттыға аласың.' : 'Аяқтау батырмасы жоғарыдағы бес шарт орындалғанда ашылады.'}</p>
    </section>
    <LessonNavigation current="sensors" pager />
    <section className="hw-panel" aria-labelledby="sn-sources"><h2 id="sn-sources">Ресми дереккөздер</h2><p>Тексерілген күні: 15.11.2026. Сілтемелер English тілінде, жаңа бетте ашылады. FIRST Using Sensors бетіндегі Color-Distance үлгісі API мағынасы үшін ғана қолданылды; осы сабақтың қосылымы REV 2m моделіне арналған.</p><ul className="hw-list">
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/onbot_java/using_sensors/Using-Sensors-%28OnBot-Java%29.html" target="_blank" rel="noreferrer">FIRST: Using Sensors — DistanceUnit.CM</a></li>
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/control_hard_compon/rc_components/sensors/sensors.html" target="_blank" rel="noreferrer">FIRST: Sensors — REV 2m және өлшем шектеулері</a></li>
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/onbot_java/creating_op_modes/Creating-and-Running-an-Op-Mode-%28OnBot-Java%29.html" target="_blank" rel="noreferrer">FIRST: OpMode құрылымы және hardwareMap</a></li>
      <li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/SensorREV2mDistance.java" target="_blank" rel="noreferrer">FIRST: SensorREV2mDistance.java</a></li>
      <li><a href="https://docs.revrobotics.com/duo-control/sensors/i2c" target="_blank" rel="noreferrer">REV: I2C қосылымы</a></li>
      <li><a href="https://docs.revrobotics.com/rev-crossover-products/sensors/2m-distance/application-examples" target="_blank" rel="noreferrer">REV: 2m Distance Sensor конфигурациясы мен шектеулері</a></li>
      <li><a href="https://docs.revrobotics.com/rev-crossover-products/sensors/2m-distance/specs" target="_blank" rel="noreferrer">REV: REV-31-1505 сипаттамасы</a></li>
      <li><a href="https://docs.oracle.com/javase/8/docs/api/java/lang/Double.html#isFinite-double-" target="_blank" rel="noreferrer">Oracle Java: Double.isFinite()</a></li>
    </ul></section>
  </div>
}
