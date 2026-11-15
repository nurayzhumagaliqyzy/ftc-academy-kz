import { useEffect, useRef, useState } from 'react'
import { LessonCodeExercise, LessonNavigation, LessonQuiz, LessonScenario, ReadingSection } from './LessonComponents'
import { EncoderLab } from './EncoderLab'
import {
  canCompleteEncoder, loadEncoderProgress, normalizeEncoderProgress, saveEncoderProgress,
  encoderCodeScore, encoderCodeTasks, encoderJavaExample, encoderProgressPercent, encoderQuestions,
  encoderQuizPassed, encoderQuizScore, encoderReadings, encoderScenario,
} from './encoderModel'
import type { EncoderProgress, EncoderReadingId } from './encoderModel'
import './encoder.css'

export function EncoderLesson() {
  const [progress, setProgress] = useState(loadEncoderProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setStorageAvailable(saveEncoderProgress(progress)) }, [progress])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('encoder-lesson')?.scrollIntoView({ block: 'start' })
  }, [])
  function update(change: (previous: EncoderProgress) => EncoderProgress) {
    setProgress(previous => normalizeEncoderProgress(change(previous)))
  }
  function readingProps(id: EncoderReadingId) {
    const index = encoderReadings.findIndex(section => section.id === id)
    return { id: 'en-' + id, title: encoderReadings[index].title, index: index + 1, read: progress.read.includes(id),
      onRead: () => update(previous => ({ ...previous, read: previous.read.includes(id) ? previous.read.filter(item => item !== id) : [...previous.read, id] })) }
  }
  function jumpTo(id: string) {
    const target = document.getElementById('en-' + id)
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' })
  }
  const ready = canCompleteEncoder(progress)
  const percent = encoderProgressPercent(progress)
  const answered = encoderQuestions.filter(question => progress.answers[question.id] !== undefined).length
  return <div className="hardware-module programming-lesson en-lesson" id="encoder-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / 7-САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>Encoder (айналымды өлшейтін құрылғы) және нысаналы позицияға қозғалу</h1>
      <p>Encoder есебін оқып, таңбалы tick нысанасына қарай қозғалысты жоспарла. Target, ағымдағы есеп және физикалық орынның айырмасын түсіндір.</p>
      <div className="pl-meta"><span>Бастапқы деңгей · 9-сынып</span><span>Шамамен 40–50 минут</span></div>
    </div>
    <LessonNavigation current="encoder" />
    <section className="hw-panel pl-progress" aria-labelledby="en-progress">
      <div className="hw-section-head"><h2 id="en-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed ? 'Аяқталды' : 'Оқу барысында'}</span></div>
      <progress className="hw-meter" max={100} value={percent} aria-label="Жетінші сабақтағы прогресс">{percent}%</progress>
      <p>Теория: {progress.read.length}/4 · Lab: {progress.solved.length}/3 · Java: {encoderCodeScore(progress)}/5 · Тест: {encoderQuizScore(progress)}/5 · Жағдаят: {progress.scenarioAnswer === encoderScenario.answer ? 'орындалды' : 'әлі орындалмады'}</p>
      <p className="hw-muted" role="status">{storageAvailable ? 'Осы сабақтың прогресі браузерде бөлек сақталады. Алдыңғы алты сабақтың нәтижелері сақталады.' : 'Браузерде сақтау қолжетімсіз. Бетті жапқанда осы сабақтағы жаңа прогресс жоғалады.'}</p>
    </section>
    <nav className="pl-jumps" aria-label="Жетінші сабақ бөлімдері">{[['ticks', 'Теория'], ['lab', 'Encoder Lab'], ['code-exercise', 'Java тапсырмасы'], ['example', 'Толық Java мысалы'], ['quiz', 'Тест'], ['scenario', 'Жағдаят'], ['completion', 'Аяқтау']].map(([id, label]) => <button type="button" className="hw-button hw-button-secondary" key={id} onClick={() => jumpTo(id)}>{label}</button>)}</nav>
    <section className="hw-panel" aria-labelledby="en-objectives">
      <p className="hw-kicker">БҮГІН НЕ ҮЙРЕНЕСІҢ?</p><h2 id="en-objectives">Оқу мақсаттары</h2>
      <ul className="hw-list"><li>Incremental Encoder (айналу өсімін есептейтін құрылғы), tick және counts per revolution ұғымдарын түсіну.</li><li>Мотордың төрт run mode режимін салыстырып, target → RUN_TO_POSITION → теріс емес қуат ретін қолдану.</li><li>Таңбалы current/target айырмасын есептеп, нөлдік есеп басының өзгеруін түсіндіру.</li><li>Толеранттылық, таймаут және STOP арқылы шектелген бір моторлы Java мысалын оқу.</li></ul>
      <p className="pl-outcome"><b>Күтілетін нәтиже:</b> 200→800 және 500→100 үшін +600/−400 айырмаларын табасың; жаңа нөлден +360 нысанасын орындайсың; теріс қуатсыз бағыт таңдалуын және 360 tick-тің әмбебап бір айналым еместігін түсіндіресің.</p>
      <p className="pl-prerequisite">Дайындық: <a className="hw-back" href="#programming/dc-motor">2-сабақтағы DC Motor (тұрақты ток қозғалтқышы)</a>, <a className="hw-back" href="#programming/autonomous">4-сабақтағы Autonomous (автономды режим)</a> және <a className="hw-back" href="#programming/sensors">6-сабақтағы Sensor (датчик) кері байланысы</a>.</p>
    </section>
    <ReadingSection {...readingProps('ticks')}>
      <p>Encoder біліктің бұрылу өсімін өлшейді. Incremental Encoder айналу кезінде шағын импульстар береді; Control Hub (басқару блогы) оларды tick (есептеу импульстары) ретінде санайды. Quadrature (екі арналы) сигналдардың реті айналу бағытын да ажыратуға көмектеседі. Есеп нөлге қатысты өсуі не кемуі мүмкін: теріс tick — міндетті түрде ақау емес.</p>
      <p><b>Motor shaft (мотор білігі)</b> — мотордың өз білігі; <b>output shaft (шығыс білігі)</b> — gearbox (редуктор) кейінгі білік. Encoder көбіне редукторға дейінгі айналуды санайды. Бір шығыс айналымына мотор білігі бірнеше рет айналатындықтан, редуктор tick санын өзгертеді. Encoder түрі, декодтау тәсілі және беріліс қатынасы әр моторда әртүрлі.</p>
      <p>Осы сабақта <b>CPR = counts per revolution (бір айналымдағы декодталған есеп саны)</b> мағынасында қолданамыз. Кей өндіруші CPR-ді cycles per revolution (бір арнаның циклдері) деп қысқартады; quadrature 4× декодтауда counts саны одан төрт есе болуы мүмкін. Құжаттағы cycles пен decoded counts-ты және қай білік туралы айтылғанын тексер; дайын decoded counts санын қайтадан төртке көбейтпе.</p>
      <p>Нақты мысал — REV Motor Encoders кестесіндегі <b>20:1 HD Hex Motor</b>: мотор білігіне 28 decoded count, шығыс айналымына <b>28 × 20 = 560 tick</b>. Сондықтан 280 tick — 0.5 шығыс айналымы; 360 tick — 360/560 ≈ 0.643 айналым. Бұл 360°-пен бірдей шама емес. UltraPlanetary сияқты өзге редукторда атаудағы номинал қатынас пен нақты қатынас бөлек болуы мүмкін; сол құрылғының дерегін қолдан.</p>
      <figure className="pl-code-figure"><figcaption>Тек осы мысал: 560 tick/шығыс айналымы, сыртқы беріліс 1:1, дөңгелек диаметрі 10 см</figcaption><pre tabIndex={0}><code>{'Дөңгелек шеңбері = π × 10 ≈ 31.416 см\n280 tick / 560 = 0.5 айналым\nИдеал жол = 0.5 × 31.416 ≈ 15.708 см'}</code></pre></figure>
      <p>Егер мотор шығысынан дөңгелекке қосымша 2:1 баяулатқыш беріліс болса, бір дөңгелек айналымына 560 × 2 = 1120 tick керек. Ішкі 20:1 қатынасы 560 санына кіріп қойған — оны екінші рет көбейтпе. Tick автоматты түрде сантиметр емес: білік, толық беріліс, дөңгелек шеңбері және сырғанау әсері керек.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('modes')}>
      <p>Run mode (мотордың жұмыс режимі) <code>motor.setMode(DcMotor.RunMode.…)</code> арқылы таңдалады. Режим қандай шаманы басқаратынын анықтайды; бір режимдегі қуат таңбасының ережесін екіншісіне ойланбай көшірме.</p>
      <div className="hw-table-scroll"><table className="hw-table"><caption>FTC моторының төрт режимі</caption><thead><tr><th scope="col">Режим</th><th scope="col">Қызметі</th><th scope="col">Есте сақта</th></tr></thead><tbody>
        <tr><td><code>STOP_AND_RESET_ENCODER</code></td><td>Жетекті тоқтатып, Encoder есебін нөлдейді</td><td>Білікті механикалық нөлге апармайды; кейін жұмыс режимін таңда</td></tr>
        <tr><td><code>RUN_WITHOUT_ENCODER</code></td><td>Қуат пәрменін Encoder бойынша жылдамдық реттеусіз береді</td><td>Қосылған Encoder-дің current есебін бәрібір оқуға болады</td></tr>
        <tr><td><code>RUN_USING_ENCODER</code></td><td>Encoder кері байланысымен жылдамдықты реттейді</td><td>Нысаналы позицияда өздігінен тоқтайтын режим емес</td></tr>
        <tr><td><code>RUN_TO_POSITION</code></td><td>Encoder нысанасына жетуге ұмтылады</td><td>Target пен current арқылы бағытты анықтайды; мотор типінің конфигурациясы дұрыс болсын</td></tr>
      </tbody></table></div>
      <p><code>RUN_USING_ENCODER</code> мен <code>RUN_TO_POSITION</code> үшін Hub мотордың сипаттамаларын конфигурациядан пайдаланады. Driver Station (оператор станциясы) ішінде мотордың нақты моделін таңда. Қате counts/revolution немесе мотор сипаттамасы реттеуге әсер етуі мүмкін; жай ғана <code>DcMotor</code> типін жазу дұрыс аппараттық конфигурацияны алмастырмайды.</p>
      <ol className="hw-list"><li>Қозғалысты бастар алдында <code>motor.setTargetPosition(targetTicks);</code> бер.</li><li>Содан кейін <code>motor.setMode(DcMotor.RunMode.RUN_TO_POSITION);</code> таңда.</li><li>Енді <code>motor.setPower(0.4);</code> сияқты <b>теріс емес қуат шамасын</b> бер. Нөлдік шама қозғалыс бермейді.</li></ol>
      <p>Current 200, target 800 болса есеп өседі; current 500, target 100 болса кемиді. Екі жағдайда да қуат шамасы 0.4 бола алады. Бұл режимде теріс setPower() арқылы кері бағытты үйретпейміз: бағытты target-тің current-ке қатысты орны анықтайды. Нақты механикалық «алға/артқа» мотор орнатылуына және FORWARD/REVERSE баптауына байланысты.</p>
      <p className="hw-note">RUN_TO_POSITION нысанаға жеткеннен кейін де позицияны ұстауға тырысуы мүмкін. Механизм тірелсе, ол күш беріп, қызуы мүмкін. Қозғалысты STOP, timeout және нөлдік қуатпен шекте; қажет болса режимнен шық. Бірдей код барлық механизмге бірдей қауіпсіз болмайды.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('api')}>
      <p>FTC SDK (бағдарламалық әзірлеу жинағы) ішінде <code>DcMotor</code> — бір моторды басқару типі. <code>hardwareMap.get(DcMotor.class, "motor")</code> конфигурациядағы <code>motor</code> атауына сәйкес құрылғыны алады. Мотордың қорек кабелі Motor портына, ал кіріктірілген Encoder кабелі сол моторға сәйкес Encoder портына жалғануы керек. Қорек пен Encoder — екі бөлек қосылым; ауыстырып қоспа.</p>
      <dl className="hw-facts"><div><dt><code>getCurrentPosition()</code></dt><dd>Ағымдағы нөлдік есеп басына қатысты өлшенген Encoder count мәнін <code>int</code> ретінде береді. Ол роботтың абсолют координатасы емес.</dd></div><div><dt><code>setTargetPosition()</code> / <code>getTargetPosition()</code></dt><dd>Нысаналы Encoder count-ты береді / қайтарады. Current 200 кезінде setTargetPosition(800) «тағы 800» емес: осы санақ жүйесінде 800-ге бару. Салыстырмалы +300 үшін target = current + 300 деп есепте.</dd></div><div><dt><code>setMode()</code> / <code>setPower()</code></dt><dd>Режим мен қуат пәрменін таңдайды. RUN_TO_POSITION кезінде target алдымен орнатылып, қуат теріс емес шама ретінде беріледі. Қуат нақты RPM (минуттағы айналым саны) өлшемі емес.</dd></div><div><dt><code>isBusy()</code></dt><dd>Мотор контроллері нысанаға ұмтылып тұрғанын тексереді. Аяқталу шегі контроллерге байланысты; false мәні нақты роботтың дәл орнын растамайды. Қалдықты да telemetry арқылы тексер.</dd></div><div><dt><code>opModeIsActive()</code> / <code>telemetry</code></dt><dd>OpMode (роботты басқару бағдарламасы) белсенділігін тексереді; операторға target, current және қалдықты көрсетеді. Циклді тек isBusy()-ге сүйендірмей, STOP пен timeout шарттарын қос.</dd></div></dl>
      <p><b>Үш шаманы ажырат:</b> target — берілген пәрмен; current — Encoder санаған өсім; actual physical position (нақты физикалық орын) — білік, механизм не роботтың шынайы қалпы. Жоғалған импульс, берілістегі люфт, дөңгелек сырғанауы немесе механизмнің тірелуі осы ұғымдарды теңестіруге мүмкіндік бермейді.</p>
      <figure className="pl-code-figure"><figcaption>Қалдықтың таңбасы — tick есебінің өзгеру бағыты</figcaption><pre tabIndex={0}><code lang="en">{'int current = motor.getCurrentPosition();\nint target = motor.getTargetPosition();\nint remaining = target - current;'}</code></pre></figure>
      <p>Remaining оң болса есеп өсуі керек, теріс болса кемуі керек, нөл болса санақ бойынша target-пен тең. Қалдықты current − target деп керісінше есептесең, таңба ауысады. Бұл айырма сантиметр не географиялық координата болып саналмайды.</p>
    </ReadingSection>
    <ReadingSection {...readingProps('limits')}>
      <p>Position tolerance (позицияға рұқсат етілетін ауытқу) — нысанаға жеткілікті жақындауды қабылдау шегі. Мысалы, қолданбада <code>Math.abs(remaining) &lt;= 10</code> болса «10 tick ішінде» деп тоқтатуға болады. Бұл SDK-ның барлық моторға ортақ әдепкі tolerance мәні емес; төмендегі Java кодындағы жеке қолданба шарты.</p>
      <p>Encoder reset есеп басын сол тұрған орынға нөлдейді. Current 500 және target 800 болса, қалғаны +300. Reset-тен кейін current 0 болады; сол бастапқы ниетке енді target 300 керек. Ескі 800 санын жаңа нөлге көшірсең, +800 сұрайсың. Механикалық бірдей бастапқы қалып қажет болса, оны бөлек homing (бастапқы орынды анықтау) рәсімімен орнат; жай нөлдеу оны таппайды.</p>
      <p>Нақты мотор инерциядан нысанадан асып кетуі мүмкін: бұл overshoot (артық өту). Мысалы, target 800, current 820 болса remaining −20. Қуатты азайту, дұрыс мотор конфигурациясы және механизмді тексеру қажет болуы мүмкін. Біздің Lab әр қадамды қалдыққа дейін қысқартып, мұндай физиканы әдейі есептемейді.</p>
      <ul className="hw-list"><li><b>Мотор айналады, current өзгермейді:</b> STOP бер; қоректі ажыратқаннан кейін Encoder кабелін, тиісті портты және мотор моделін тексер.</li><li><b>Есеп күтпеген бағытта өзгереді:</b> бағыт баптауын, порттардың сәйкестігін және нөлдік санақты тексер. RUN_TO_POSITION ішінде теріс қуат беруді әмбебап түзету деп қабылдама.</li><li><b>Механизм тірелді:</b> current target-ке жетпей қалуы мүмкін; isBusy() ұзақ true болуы ықтимал. Қолмен күштемей, STOP беріп, қоректі ажыратып, жүктемені қауіпсіздендір.</li><li><b>Ұзақ күту:</b> нақты аппараттық мысалда 5 секундтық timeout бар; бітсе қуатты нөлдеп, жетті деп хабарлама. Бұл мәнді өз механизмің үшін бөлек бағала.</li></ul>
      <p className="hw-note">Encoder кері байланысы басқаруды жақсартады, бірақ дәл дөңгелек жолын немесе роботтың абсолют орнын кепілдемейді. Сынақта моторды бекіт; дөңгелекті жерден көтер. Reset пен режимнен шығу тік көтергішті ұстап тұруға кепілдік бермейді. Механизмге қол тигізерде қоректі ажырат және жүктемені тіре.</p>
    </ReadingSection>
    <EncoderLab solved={progress.solved} onSolve={id => update(previous => ({ ...previous, solved: [...previous.solved, id] }))} onRetry={() => update(previous => ({ ...previous, solved: [], completed: false }))} />
    <LessonCodeExercise id="en-code-exercise" title="Encoder кодын толықтыр" tasks={encoderCodeTasks} answers={progress.code} onChange={(id, value) => update(previous => ({ ...previous, code: { ...previous.code, [id]: value } }))} />
    <section className="hw-panel" aria-labelledby="en-example">
      <p className="hw-kicker">ТОЛЫҚ БАҒДАРЛАМА</p><h2 id="en-example" tabIndex={-1}>EncoderPosition.java · Encoder-і бар бір мотор</h2>
      <p>FTC SDK жобасының TeamCode модулінде <b>EncoderPosition.java</b> файлын қолдан. Driver Station конфигурациясында нақты қолданылған мотор типін таңда. Мысал үшін REV кестесіндегі 20:1 HD Hex (560 tick/шығыс айналымы) алынды; конфигурация атауы <code>motor</code>. Оның қорек және Encoder кабельдерін Control Hub-тағы бір моторға сәйкес порттарға жалға. Басқа моторда counts пен нақты берілісті қайта тексер.</p>
      <p>Бұл Autonomous бағдарламасы нөлден 560 tick нысанасын сұрайды, яғни таңдалған мысалда бір шығыс айналымын жоспарлайды. Ол толық Drivetrain (роботтың жүріс жүйесі) емес. Қауіпсіз бекітілген бір моторда сынауға арналған. INIT кезінде қуат нөл; START-тан кейін ғана target → RUN_TO_POSITION → 0.4 реті орындалады.</p>
      <figure className="pl-code-figure"><figcaption>Аппараттық Java мысалы · Lab-тың 60 tick қадамына тәуелсіз</figcaption><pre tabIndex={0} aria-label="Encoder арқылы бір моторды басқаратын толық Java мысалы"><code lang="en">{encoderJavaExample}</code></pre></figure>
      <dl className="hw-facts"><div><dt>Импорттар, <code>@Autonomous</code>, <code>LinearOpMode</code></dt><dd>SDK мотор, режим және ElapsedTime таймерін қосады. runOpMode() бағдарламаның негізгі орындалу әдісі; файл мен public class атауы сәйкес болсын.</dd></div><div><dt>INIT: <code>setPower(0)</code>, reset және <code>RUN_USING_ENCODER</code></dt><dd>Қуатты нөлдейді, нөлдік санақты бекітеді және жұмыс режиміне ауысады. Білікті механикалық бастапқы орынға қозғалтпайды.</dd></div><div><dt><code>waitForStart()</code> және белсенділік тексеруі</dt><dd>START күтеді. STOP сұралса, !opModeIsActive() арқылы шығып, finally қуатты нөлдейді.</dd></div><div><dt>Target 560 → режим → қуат 0.4</dt><dd>Нысана режимнен бұрын қойылады. ElapsedTime.reset() таймауттың басталуын белгілейді; 0.4 теріс емес шама ретінде беріледі.</dd></div><div><dt>Циклдің төрт шарты</dt><dd>OpMode белсенді, isBusy() true, қалдық 10 tick-тен үлкен және 5 секунд бітпеген кезде ғана жалғасады. Telemetry target/current/remaining көрсетеді. Жетудің нақты қабылдануы контроллердің isBusy шегі мен қолданбадағы 10 tick шартына тәуелді.</dd></div><div><dt>Нәтиже және <code>finally</code></dt><dd>Алдымен қуат нөлденеді. Қалдық ≤10 болса ғана қолданба шегі орындалды деп көрсетіледі; әйтпесе timeout немесе контроллердің busy емес күйі бөлек хабарланады. finally қуатты қайта нөлдеп, RUN_WITHOUT_ENCODER арқылы позиция ұстау режимінен шығады.</dd></div></dl>
      <p className="hw-note">Java мысалында нақты уақыт тек timeout үшін қолданылады. Lab-та физикалық уақыт жоқ, тек бекітілген сандық қадамдар бар. 10 tick — қолданбаның мысал шегі, SDK контроллерінің tolerance баптауын өзгертпейді. Нақты орынның дәлдігі мен жүктемені ұстап тұру бөлек бағаланады.</p>
      <p>Код ресми FIRST пәрмен ретімен салыстырылды. Бұл веб-бет оны құрастырмайды не роботта орындамайды; толық FTC SDK компиляциясы орындалған жоқ.</p>
    </section>
    <LessonQuiz id="en-quiz" questions={encoderQuestions} answers={progress.answers}
      onAnswer={(id, answer) => update(previous => previous.answers[id] !== undefined ? previous : { ...previous, answers: { ...previous.answers, [id]: answer } })}
      onRetry={() => update(previous => ({ ...previous, answers: {}, completed: false }))} retryNote="Қайта бастағанда тек тест жауаптары мен аяқталу белгісі жаңарады. Теория, Lab, Java және жағдаят сақталады." />
    <LessonScenario id="en-scenario" question={encoderScenario} answer={progress.scenarioAnswer}
      onAnswer={answer => update(previous => previous.scenarioAnswer !== undefined ? previous : { ...previous, scenarioAnswer: answer })}
      onRetry={() => update(previous => ({ ...previous, scenarioAnswer: undefined, completed: false }))} />
    <section className="hw-panel" aria-labelledby="en-completion"><h2 id="en-completion" tabIndex={-1}>Сабақты аяқтау</h2>
      <ul className="pl-checklist"><li>{progress.read.length === 4 ? '✓' : '○'} Теорияны оқу ({progress.read.length}/4)</li><li>{progress.solved.length === 3 ? '✓' : '○'} Lab: орындау, сандық айырма және түсіндірме ({progress.solved.length}/3)</li><li>{encoderCodeScore(progress) === 5 ? '✓' : '○'} Java тапсырмасы ({encoderCodeScore(progress)}/5)</li><li>{encoderQuizPassed(progress) ? '✓' : '○'} Тест: бес жауап және кемінде 4/5 ({answered}/5 жауап, {encoderQuizScore(progress)}/5 дұрыс)</li><li>{progress.scenarioAnswer === encoderScenario.answer ? '✓' : '○'} Диагностикалық жағдаят дұрыс</li></ul>
      <button type="button" className="hw-button" disabled={!ready || progress.completed} onClick={() => update(previous => ({ ...previous, completed: true }))}>{progress.completed ? '✓ Сабақ аяқталды' : 'Сабақты аяқтадым'}</button><p role="status">{progress.completed ? 'Жарайсың! Нысанаға қатысты айырманы, бағытты және Encoder нөлдеуін түсіндірдің.' : 'Аяқтау батырмасы жоғарыдағы бес шарт орындалғанда ашылады.'}</p>
    </section>
    <LessonNavigation current="encoder" pager />
    <section className="hw-panel" aria-labelledby="en-sources"><h2 id="en-sources">Ресми дереккөздер</h2><p>Тексерілген күні: 15.11.2026. English тілінде, жаңа бетте ашылады.</p><ul className="hw-list">
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/control_hard_compon/rc_components/encoders/encoders.html" target="_blank" rel="noreferrer">FIRST: Encoders (Rotation Counters)</a></li>
      <li><a href="https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips/tech-tip-motor-modes/tech-tip-motor-modes.html" target="_blank" rel="noreferrer">FIRST: Motor Modes and Encoders — RUN_TO_POSITION қуаты</a></li>
      <li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/RobotAutoDriveByEncoder_Linear.java" target="_blank" rel="noreferrer">FIRST: Encoder үлгісі — target/mode/power, STOP және timeout</a></li>
      <li><a href="https://docs.revrobotics.com/duo-control/hello-robot-blocks/part-3/using-encoder" target="_blank" rel="noreferrer">REV: Encoder және төрт run mode</a></li>
      <li><a href="https://docs.revrobotics.com/duo-control/sensors/encoders/motor-based-encoders" target="_blank" rel="noreferrer">REV: Motor Encoders — 20:1 HD Hex үшін 560 count</a></li>
      <li><a href="https://docs.revrobotics.com/duo-control/hello-robot-blocks/part-3/autonomous-navigation-blocks/converting-encoder-ticks-to-a-distance" target="_blank" rel="noreferrer">REV: Tick-ті жолға түрлендіру және нақты беріліс қатынасы</a></li>
    </ul></section>
  </div>
}
