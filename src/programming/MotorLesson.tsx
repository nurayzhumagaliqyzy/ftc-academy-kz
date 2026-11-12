import { useEffect, useRef, useState } from 'react'
import { LessonNavigation, LessonQuiz, ReadingSection } from './LessonComponents'
import { MotorLab } from './MotorLab'
import {
  canCompleteMotor, codeTasks, loadMotorProgress, motorCodeScore, motorJavaExample, motorProgressPercent,
  motorQuestions, motorQuizPassed, motorQuizScore, motorReadings, normalizeMotorProgress, saveMotorProgress,
} from './motorModel'
import type { MotorProgress, MotorReadingId } from './motorModel'
import './motor.css'

function MotorCodeExercise({ answers, onChange }: { answers: MotorProgress['code']; onChange: (id: string, value: string) => void }) {
  return <section className="hw-panel" aria-labelledby="ml-code-exercise">
    <div className="hw-section-head"><div><p className="hw-kicker">JAVA / БОС ОРЫНДЫ ТОЛТЫР</p><h2 id="ml-code-exercise" tabIndex={-1}>Кодтың жетіспейтін бөлігін таңда</h2></div><span className="hw-count">{codeTasks.filter(task => answers[task.id] === task.answer).length}/5 дұрыс</span></div>
    <p>Әр жолдағы бос орынға дұрыс Java бөлігін таңда. Қате жауапты өзгертуге болады. Бұл — кодты үйрену тапсырмасы, Java компиляторы емес; код орындалмайды.</p>
    <div className="pl-matches ml-code-tasks">
      {codeTasks.map((task, index) => {
        const selected = answers[task.id] ?? ''
        const correct = selected === task.answer
        return <div className="hw-detail" key={task.id}>
          <label className="pl-match-label" htmlFor={'ml-code-' + task.id}>{index + 1}. {task.prompt}</label>
          <pre className="ml-code-line"><code>{task.before}<mark>{selected || '___'}</mark>{task.after}</code></pre>
          <select id={'ml-code-' + task.id} value={selected} aria-describedby={selected ? 'ml-code-feedback-' + task.id : undefined}
            onChange={event => onChange(task.id, event.target.value)}>
            <option value="">Java бөлігін таңда…</option>
            {task.options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <div aria-live="polite" aria-atomic="true">
            {selected && <div id={'ml-code-feedback-' + task.id} className="hw-feedback" data-kind={correct ? 'good' : 'bad'}>
              <strong>{correct ? '✓ Дұрыс!' : 'Бұл бөлік сәйкес емес.'}</strong><p>{task.explanation}</p>
            </div>}
          </div>
        </div>
      })}
    </div>
    <p className="hw-muted pl-retry-note">Бұл бес жол — жеке код үзінділері. Толық бағдарламаның реті төменде көрсетілген; моторды іске қосу тек START пәрменінен кейін орындалуы тиіс.</p>
  </section>
}

export function MotorLesson() {
  const [progress, setProgress] = useState(loadMotorProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setStorageAvailable(saveMotorProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('motor-lesson')?.scrollIntoView({ block: 'start' })
  }, [])
  function update(change: (previous: MotorProgress) => MotorProgress) {
    setProgress(previous => normalizeMotorProgress(change(previous)))
  }
  function readingProps(id: MotorReadingId) {
    const index = motorReadings.findIndex(section => section.id === id)
    return {
      id: 'ml-' + id, title: motorReadings[index].title, index: index + 1, read: progress.read.includes(id),
      onRead: () => update(previous => ({ ...previous, read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id] })),
    }
  }
  function jumpTo(id: string) {
    const element = document.getElementById('ml-' + id)
    element?.focus({ preventScroll: true })
    element?.scrollIntoView({ block: 'start' })
  }
  const ready = canCompleteMotor(progress)
  const percent = motorProgressPercent(progress)
  const answered = motorQuestions.filter(question => progress.answers[question.id] !== undefined).length

  return <div className="hardware-module programming-lesson motor-lesson" id="motor-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 2-САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>DC Motor (тұрақты ток қозғалтқышы) басқару</h1>
      <p>Бірінші сабақтағы OpMode (роботты басқару бағдарламасы) құрылымын енді моторға пәрмен беру үшін қолдан.</p>
      <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 40–50 минут</span></div>
    </div>
    <LessonNavigation current="dc-motor" />
    <section className="hw-panel pl-progress" aria-labelledby="ml-progress">
      <div className="hw-section-head"><h2 id="ml-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span></div>
      <progress className="hw-meter" max={100} value={percent} aria-label="Екінші сабақтағы прогресс">{percent}%</progress>
      <p>Теория: {progress.read.length}/4 · Lab: {progress.labDone ? 'орындалды' : 'әлі орындалмады'} · Java: {motorCodeScore(progress)}/5 · Тест: {motorQuizScore(progress)}/5</p>
      <p className="hw-muted" role="status">{storageAvailable ? 'Прогресс осы браузерде сақталады. Бірінші сабақтың нәтижелері бөлек сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда осы сабақтағы жаңа прогресс жоғалады.'}</p>
    </section>
    <nav className="pl-jumps" aria-label="Екінші сабақ бөлімдері">
      {[['motor', 'Теория'], ['lab', 'Motor Control Lab'], ['code-exercise', 'Java тапсырмасы'], ['example', 'Толық Java мысалы'], ['quiz', 'Тест'], ['completion', 'Аяқтау']].map(([id, label]) =>
        <button className="hw-button hw-button-secondary" key={id} type="button" onClick={() => jumpTo(id)}>{label}</button>)}
    </nav>
    <section className="hw-panel" aria-labelledby="ml-objectives">
      <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p><h2 id="ml-objectives">Оқу мақсаттары</h2>
      <ul className="hw-list">
        <li>DC Motor қызметін және оның Control Hub-қа (басқару блогына) қосылу жолын түсінесің.</li>
        <li>Оң, теріс және нөлдік қуаттың FORWARD (негізгі бағыт) / REVERSE (кері бағыт) баптауымен байланысын ажыратасың.</li>
        <li>FTC SDK (бағдарламалық әзірлеу жинағы) ішіндегі <code>DcMotor</code>, <code>hardwareMap.get()</code>, <code>setPower()</code> және <code>setDirection()</code> қолданылуын танисың.</li>
        <li>Моторды іске қосу мен тоқтату кодын оқып, жиі кездесетін қателерді табасың.</li>
      </ul>
      <p className="pl-prerequisite">Дайындық: <a className="hw-back" href="#programming/sdk-opmode">1-сабақтағы LinearOpMode, waitForStart() және opModeIsActive() ұғымдарын қайтала →</a></p>
    </section>
    <ReadingSection {...readingProps('motor')}>
      <p>DC Motor электр энергиясын механикалық қозғалысқа айналдырады: оның білігі айналып, дөңгелекті немесе механизмді қозғалысқа келтіреді. Ішіндегі магнит өрісі мен ток өтетін орам өзара әсерлесіп, айналдыру күшін тудырады.</p>
      <p>Мысалы, роботтың дөңгелегін айналдыру үшін мотор қолданамыз. Мотордың өзі «алға жүр» деген мақсатты білмейді — бағдарлама оған қуат пен бағыт пәрменін береді.</p>
      <p>Қуат пәрмені жылдамдықтың нақты өлшемі емес. Бірдей <code>setPower(0.5)</code> әртүрлі моторда немесе жүктемеде бірдей RPM (минуттағы айналым саны) бермейді.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('connection')}>
      <ol className="hw-list">
        <li>Нақты құрылғының қорегін өшір. Моторды қозғалмайтын тірекке бекіт; айналатын бөлікке қол тигізбе.</li>
        <li>Мотордың екі сымды қорек кабелін Control Hub-тағы <b>Motor 0</b> портына тиісті кабельмен қос. Hub-та Motor порттары 0–3 деп нөмірленген. Servo не Encoder порты мотор қорегін алмастырмайды.</li>
        <li>Driver Station (оператордың басқару қолданбасы) конфигурациясында Motor 0 үшін мотордың дұрыс түрін таңда, атауын <code>motor</code> деп беріп, конфигурацияны сақтап іске қос.</li>
        <li>Кодтағы <code>"motor"</code> атауы конфигурациядағы атаумен дәл сәйкес келсін. Порт нөмірі мен құрылғы атауы — екі бөлек ұғым.</li>
      </ol>
      <p>Encoder (айналымды өлшейтін құрылғы) кабелі — бөлек сигнал қосылымы. Бұл сабақтағы <code>RUN_WITHOUT_ENCODER</code> режимі айналым кері байланысын қолданбайды; моторды қуатпен басқару үшін Encoder дерегі қажет емес.</p>
      <p className="hw-note">Қосылымды тексерген соң ғана қоректі қос. Браузердегі Lab нақты Control Hub-қа қосылмайды.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('power')}>
      <dl className="hw-facts">
        <div><dt>setPower(−1.0…+1.0)</dt><dd>Осы сабақтағы <code>RUN_WITHOUT_ENCODER</code> режимінде қуаттың шамасы пәрмен деңгейін, таңбасы бағыт әсерін анықтайды. <code>0.5</code> — ватт, вольт немесе нақты RPM емес.</dd></div>
        <div><dt>setDirection()</dt><dd><code>FORWARD</code> — негізгі логикалық бағыт. <code>REVERSE</code> сол қуат пәрменінің бағыт әсерін кері аударады. <code>REVERSE</code> және теріс қуат бірге қолданылса, екі кері әсер бірін-бірі жояды.</dd></div>
        <div><dt>setPower(0)</dt><dd>Жетек қуатын нөлге қояды. Теріс қуат моторды тоқтату пәрмені емес. Нақты механизмнің толық тоқтауына уақыт керек болуы мүмкін.</dd></div>
      </dl>
      <div className="hw-table-scroll"><table className="hw-table"><caption>Қуат таңбасы мен бағыт баптауы</caption><thead><tr><th scope="col">Бағыт</th><th scope="col">Қуат</th><th scope="col">FORWARD оң қуатпен салыстырғанда</th></tr></thead><tbody>
        <tr><td>FORWARD</td><td>+0.5</td><td>Негізгі бағыт</td></tr><tr><td>FORWARD</td><td>−0.5</td><td>Кері бағыт</td></tr>
        <tr><td>REVERSE</td><td>+0.5</td><td>Кері бағыт</td></tr><tr><td>REVERSE</td><td>−0.5</td><td>Негізгі бағыт</td></tr><tr><td>Кез келгені</td><td>0</td><td>Жетек қуаты нөл</td></tr>
      </tbody></table></div>
      <p><code>setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE)</code> нөлдік қуатта біліктің айналуына кедергі келтіреді. <code>FLOAT</code> еркін айналуға мүмкіндік береді. BRAKE білікті берілген бұрышта ұстайтын позиция реттегіші емес және қауіпсіздік тежегішін алмастырмайды.</p>
      <p className="hw-note">Нақты мотордың сағат тілімен айналуы оның түріне, қосылымына және қай жағынан қарағаныңа байланысты. Lab-тағы бағыттар — бір ғана шартты көрініс. Бұл таңба ережесін <code>RUN_TO_POSITION</code> режиміне автоматты қолданба: ол осы сабақтың ауқымына кірмейді.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('sdk')}>
      <p><code>DcMotor</code> моторды басқару API-сын ұсынады. Оқу тілінде «класс» деп айтылғанымен, FTC SDK Java API-де бұл — interface (интерфейс); төмендегі кодта ол айнымалының типі ретінде қолданылады.</p>
      <dl className="hw-facts">
        <div><dt><code>private DcMotor motor;</code></dt><dd>Моторға сілтеме сақтайтын айнымалыны жариялайды. Бұл жолдың өзі құрылғыны тауып не іске қосып бермейді.</dd></div>
        <div><dt><code>motor = hardwareMap.get(DcMotor.class, "motor");</code></dt><dd>Конфигурациядан тиісті тип пен атау бойынша моторды алады. Оны қуат пәрменінен бұрын орындау керек.</dd></div>
        <div><dt><code>motor.setPower(0.5);</code></dt><dd>Қуат пәрменін жібереді. Нақты қозғалыс пәрменін <code>waitForStart()</code> шақыруынан кейін, <code>opModeIsActive()</code> шартымен бер.</dd></div>
        <div><dt><code>motor.setDirection(DcMotorSimple.Direction.REVERSE);</code></dt><dd>Бағытты баптайды. Мұны бастапқы дайындауда нөлдік қуатпен жасаған ыңғайлы.</dd></div>
      </dl>
      <h3>Жиі кездесетін қателер</h3>
      <ul className="hw-list">
        <li><code>DCmotor</code> деп жазу, <code>import</code> не <code>;</code> ұмыту → Java синтаксисін дәл сақта.</li>
        <li><code>"Motor"</code> пен <code>"motor"</code> атауларын шатастыру → конфигурациямен салыстыр.</li>
        <li>Моторды <code>hardwareMap.get()</code> арқылы алмай тұрып қолдану → алдымен инициализацияла.</li>
        <li><code>setPower(50)</code> жазу → жарамды −1…+1 аралығын пайдалан.</li>
        <li>Теріс қуатты «тоқтау» деп ойлау → тоқтату үшін <code>setPower(0)</code> қолдан.</li>
        <li>START-ты күтпеу немесе шексіз <code>while (true)</code> қолдану → іске қосу және STOP (тоқтату) пәрмендерін ескер.</li>
      </ul>
    </ReadingSection>
    <MotorLab done={progress.labDone} onComplete={() => update(previous => ({ ...previous, labDone: true }))} />
    <MotorCodeExercise answers={progress.code} onChange={(id, value) => update(previous => ({ ...previous, code: { ...previous.code, [id]: value } }))} />
    <section className="hw-panel" aria-labelledby="ml-example">
      <p className="hw-kicker">БІРІНШІ САБАҚТАН ЖАЛҒАСТЫРАМЫЗ</p><h2 id="ml-example" tabIndex={-1}>Толық LinearOpMode мысалы</h2>
      <p><b>MotorBasics.java</b> — TeleOp (оператор басқаратын режим) мысалы. Gamepad (ойын контроллері) A батырмасы басылып тұрғанда қуат 0.5, жіберілгенде 0 болады. Конфигурацияда <code>motor</code> атты мотор болуы керек.</p>
      <figure className="pl-code-figure"><figcaption>MotorBasics.java · FTC SDK жобасына арналған</figcaption><pre tabIndex={0} aria-label="Моторды басқаратын толық Java мысалы"><code lang="en">{motorJavaExample}</code></pre></figure>
      <ol className="hw-list">
        <li>INIT (дайындау) кезінде мотор табылады, қуаты нөлге қойылады, REVERSE, RUN_WITHOUT_ENCODER және BRAKE бапталады.</li>
        <li><code>waitForStart()</code> START пәрменін күтеді. Цикл <code>opModeIsActive()</code> белсенді болғанда ғана орындалады.</li>
        <li><code>gamepad1.a ? 0.5 : 0.0</code> — «A басылса 0.5, әйтпесе 0» деген шарт. Дерек <code>telemetry</code> (операторға күй дерегін жіберу құралы) арқылы экранға шығады.</li>
        <li><code>finally</code> блогы орындалу блогынан шыққанда, соның ішінде STOP не ерекше жағдай кезінде, моторға нөлдік қуат жібереді. Қорек жоғалуы сияқты жағдайларды Java коды басқара алмайды.</li>
      </ol>
      <p className="hw-note">Нақты сынақта моторды бекіт, дөңгелектерді жерден көтер, айналатын бөліктерден алыс тұр. A жіберілгенде және Driver Station-та STOP басылғанда қуаттың нөл болуын тексер. Кабельге қол тигізбес бұрын қоректі өшір. Веб-бет бұл кодты құрастырмайды және роботта орындамайды.</p>
    </section>
    <LessonQuiz id="ml-quiz" questions={motorQuestions} answers={progress.answers}
      onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : { ...previous, answers: { ...previous.answers, [id]: answer } })}
      onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))}
      retryNote="Қайта бастағанда тест жауаптары мен аяқталу белгісі жаңартылады. Теория, Lab және Java тапсырмасы сақталады." />
    <section className="hw-panel" aria-labelledby="ml-completion">
      <h2 id="ml-completion" tabIndex={-1}>Сабақты аяқтау</h2>
      <ul className="pl-checklist">
        <li>{progress.read.length === 4 ? '✓' : '○'} Теорияны оқылған деп белгілеу ({progress.read.length}/4)</li>
        <li>{progress.labDone ? '✓' : '○'} Lab-та нөлден өзге қуатпен іске қосып, «Тоқтату» батырмасын басу</li>
        <li>{motorCodeScore(progress) === 5 ? '✓' : '○'} Java тапсырмасы ({motorCodeScore(progress)}/5 дұрыс)</li>
        <li>{motorQuizPassed(progress) ? '✓' : '○'} Барлық бес сұраққа жауап беру және кемінде 4/5 жинау ({answered}/5 жауап, {motorQuizScore(progress)}/5 дұрыс)</li>
      </ul>
      <button className="hw-button" type="button" disabled={!ready || progress.completed} aria-describedby="ml-completion-help" onClick={() => update(previous => ({ ...previous, completed: true }))}>{progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}</button>
      <p id="ml-completion-help" className={progress.completed ? 'hw-success' : 'hw-muted'} role="status">{progress.completed ? 'Жарайсың! Сабақ аяқталды. Оған кез келген уақытта қайта орала аласың.' : ready ? 'Барлық шарт орындалды. Аяқтау батырмасын бас.' : 'Аяқтау батырмасы жоғарыдағы төрт шарт орындалғанда ашылады.'}</p>
    </section>
    <LessonNavigation current="dc-motor" pager />
    <aside className="hw-panel hw-sources" aria-labelledby="ml-sources"><h2 id="ml-sources">Ресми дереккөздер</h2><p className="hw-muted">FIRST Tech Challenge құжаттамасы және FTC SDK API · тексерілген күні: 11.11.2026. Сілтемелер English тілінде, жаңа бетте ашылады.</p>
      <ul>
        <li><a target="_blank" rel="noreferrer" href="https://ftc-docs.firstinspires.org/en/latest/control_hard_compon/rc_components/hub/ports/ch-ports.html">Control Hub порттары</a></li>
        <li><a target="_blank" rel="noreferrer" href="https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/configuring/configuring_dc_motor/configuring-dc-motor.html">Моторды конфигурациялау</a></li>
        <li><a target="_blank" rel="noreferrer" href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/onbot_java/creating_op_modes/Creating-and-Running-an-Op-Mode-(OnBot-Java).html">OpMode және hardwareMap</a></li>
        <li><a target="_blank" rel="noreferrer" href="https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips/tech-tip-motor-modes/tech-tip-motor-modes.html">Motor Modes және қуат таңбасы</a></li>
        <li><a target="_blank" rel="noreferrer" href="https://javadoc.io/static/org.firstinspires.ftc/RobotCore/10.2.0/com/qualcomm/robotcore/hardware/DcMotorSimple.html">setPower және setDirection API</a></li>
        <li><a target="_blank" rel="noreferrer" href="https://javadoc.io/static/org.firstinspires.ftc/RobotCore/10.3.0/com/qualcomm/robotcore/hardware/DcMotor.ZeroPowerBehavior.html">BRAKE және FLOAT API</a></li>
      </ul>
    </aside>
  </div>
}
