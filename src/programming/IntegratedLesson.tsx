import { useEffect, useRef, useState } from 'react'
import { LessonCodeExercise, LessonNavigation, LessonQuiz, LessonScenario, ReadingSection } from './LessonComponents'
import { IntegratedLab } from './IntegratedLab'
import { canCompleteIntegrated, integratedCodeScore, integratedCodeTasks, integratedProgressPercent, integratedQuestions, integratedQuizPassed, integratedQuizScore, integratedReadings, integratedScenario, loadIntegratedProgress, normalizeIntegratedProgress, saveIntegratedProgress } from './integratedModel'
import type { IntegratedProgress } from './integratedModel'
import './integrated.css'
const coordinationPseudocode = `// ОҚУ ПСЕВДОКОДЫ: толық Java class емес, компиляцияланбайды.
// SDK типтеріне қажет импорттар: DcMotor, Servo, DistanceSensor,
// DistanceUnit, ElapsedTime және LinearOpMode / @Autonomous.
// Нақты конфигурация: leftDrive, rightDrive, distance, claw.
// Екі моторлы differential drivetrain; бағыт/encoder/motor type тексерілген.
// openPosition, closedPosition және жол нысаналары механизмде калибрленеді.
left = hardwareMap.get(DcMotor.class, "leftDrive");
right = hardwareMap.get(DcMotor.class, "rightDrive");
left.setPower(0);
right.setPower(0);
try {
    sensor = hardwareMap.get(DistanceSensor.class, "distance");
    claw = hardwareMap.get(Servo.class, "claw");
    // INIT: екі мотордың direction, brake, encoder reference баптауы.
    waitForStart();
    if (!opModeIsActive()) return;
    timer.reset();
    while (opModeIsActive() && timer.seconds() < missionTimeoutSeconds
            && task != DONE && task != FAULT) {
        double cm = sensor.getDistance(DistanceUnit.CM);
        if (!Double.isFinite(cm) || cm <= stopDistanceCm) {
            left.setPower(0);
            right.setPower(0);
            task = FAULT;  // Соқыр айналып өтуге әрекет жасама.
        } else {
            // Төмендегі task/target/feedback — өзің әзірлейтін state machine.
            // Қозғалыс басталғанда ЕКІ моторға да:
            // setTargetPosition(calibratedTarget) → RUN_TO_POSITION → setPower(0.3).
            // Әр циклде current/remaining, isBusy және қозғалыс timeout тексер.
            // Екеуі де қажетті tolerance ішінде болмаса, келесі task-ке өтпе.
            // Заттың барын және ұсталғанын бөлек раста; Servo пәрмені дәлел емес.
            // Claw әрекеті: claw.setPosition(calibratedPosition);
            // Қысқа, шектелген WAIT күйі; ұзақ blocking sleep қолданба.
            // Жеткізу мен босату расталғанда ғана task = DONE.
        }
        telemetry.addData("Task", task);
        telemetry.addData("Distance cm", cm);
        telemetry.update();
        idle();
    }
} finally {
    left.setPower(0);
    right.setPower(0);
    // Қажет болса екі моторды позиция ұстау режимінен шығар.
    // Servo-ның қауіпсіз соңғы күйі механизм мен жүктемеге тәуелді.
}`
export function IntegratedLesson() {
  const [progress,setProgress]=useState(loadIntegratedProgress)
  const [storageAvailable,setStorageAvailable]=useState(true)
  const heading=useRef<HTMLHeadingElement>(null)
  useEffect(()=>{setStorageAvailable(saveIntegratedProgress(progress))},[progress])
  useEffect(()=>{heading.current?.focus({preventScroll:true});document.getElementById('integrated-lesson')?.scrollIntoView({block:'start'})},[])
  function update(change:(previous:IntegratedProgress)=>IntegratedProgress){setProgress(previous=>normalizeIntegratedProgress(change(previous)))}
  function readingProps(index:number){const r=integratedReadings[index];return {id:'im-'+r.id,title:r.title,index:index+1,read:progress.read.includes(r.id),onRead:()=>update(p=>({...p,read:p.read.includes(r.id)?p.read.filter(id=>id!==r.id):[...p.read,r.id]}))}}
  const percent=integratedProgressPercent(progress)
  return <div className="hardware-module programming-lesson" id="integrated-lesson">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner"><a className="hw-back" href="#programming/lessons">← Сабақтар тізіміне қайту</a><p className="hw-kicker">БАҒДАРЛАМАЛАУ / 8-САБАҚ · ҚОРЫТЫНДЫ</p><h1 ref={heading} tabIndex={-1}>FTC Integrated Challenge (қорытынды практикалық жоба)</h1><p>Жеті сабақтағы біліміңді біріктір: миссияны жоспарла, затты жина, кедергіні айналып өт, жеткізіп босат және нәтижені нақты күймен тексер.</p><div className="pl-meta"><span>9-сынып · бастапқы деңгей</span><span>40–50 минут · қажет болса екі сабақ</span></div></div>
    <LessonNavigation current="integrated-challenge"/>
    <section className="hw-panel pl-progress" aria-labelledby="im-progress"><div className="hw-section-head"><h2 id="im-progress">Сабақтағы прогресс</h2><span className="hw-count">{percent}% · {progress.completed?'Аяқталды':'Оқу барысында'}</span></div><progress className="hw-meter" max={100} value={percent} aria-label="Сегізінші сабақтағы прогресс">{percent}%</progress><p>Теория: {progress.read.length}/4 · Миссия: {progress.solved.length}/3 · Java: {integratedCodeScore(progress)}/5 · Тест: {integratedQuizScore(progress)}/5 · Жағдаят: {progress.scenarioAnswer===integratedScenario.answer?'орындалды':'әлі орындалмады'}</p><p role="status" className="hw-muted">{storageAvailable?'8-сабақ жеке сақталады. Бұрынғы жеті сабақ пен көшіру жазбалары өзгермейді.':'Браузерде сақтау қолжетімсіз. Бетті жапқанда жаңа прогресс жоғалады.'}</p></section>
    <nav className="pl-jumps" aria-label="Сегізінші сабақ бөлімдері">{[['architecture','Теория'],['lab','Mission Lab'],['code','Java тапсырмасы'],['example','Аппараттық жоспар'],['quiz','Тест'],['scenario','Жағдаят'],['completion','Аяқтау']].map(([id,label])=><button type="button" className="hw-button hw-button-secondary" key={id} onClick={()=>{const t=document.getElementById('im-'+id);t?.focus({preventScroll:true});t?.scrollIntoView({block:'start'})}}>{label}</button>)}</nav>
    <section className="hw-panel"><h2>Бүгінгі нәтиже</h2><p>FTC SDK (бағдарламалық әзірлеу жинағы), OpMode (роботты басқару бағдарламасы), DC Motor (тұрақты ток қозғалтқышы), Servo Motor (сервоқозғалтқыш), Distance Sensor (қашықтық датчигі) және Encoder (айналымды өлшейтін құрылғы) рөлдерін бір жоспарға біріктіресің. Алгоритмнің ретін, шартын және аяқталуын әрекетпен дәлелдейсің.</p><p><a href="#programming/lessons">1–7 сабақ</a> — дайындық. Gamepad (ойын контроллері) және TeleOp (оператор басқаратын режим) кірісті түсінуге көмектеседі. Бұл миссияда Gamepad-пен еркін жүргізу жоқ: ол алдын ала жоспарланған Autonomous (автономды режим) тәрізді оқу алгоритмі.</p></section>
    <ReadingSection {...readingProps(0)}>
      <p>Біріктірілген роботта әр құрылғының қызметі бөлек, ал мақсат ортақ. Input–process–output (кіріс–өңдеу–шығыс) тізбегінде Sensor сыртқы жағдайды оқиды, бағдарлама шешім қабылдайды, мотор мен Servo әрекет пәрменін алады. Encoder кейінгі циклде білік қозғалысы туралы feedback (кері байланыс) береді. Кіріс дерегін, берілген пәрменді және нақты орындалған әрекетті бір шама деп қабылдама.</p>
      <p>Мысалы, Distance Sensor алда бөгет барын хабарласа, бағдарлама алдымен өлшемнің жарамдылығын тексереді. Қауіпті не жарамсыз көрсеткіште моторларға нөлдік қуат беріледі. Бос жолда қозғалыс басталуы мүмкін. Бірақ <code>setPower(0.3)</code> — орындалған жол емес; <code>getCurrentPosition()</code> — Encoder есебі; роботтың алаңдағы нақты орны тағы да бөлек ұғым.</p>
      <p>Claw (зат ұстайтын қысқыш) стандартты Servo арқылы ашылып-жабылуы мүмкін. <code>setPosition()</code> нысаналы позиция береді; заттың ұсталғанын өлшемейді. Нақты механизмге қосымша Sensor не оператор бақылауы қажет болуы мүмкін. Оқу Lab-та объект күйі айқын ереже бойынша есептеледі, сондықтан сен қате алгоритмнің себебін көре аласың.</p>
      <p>OpMode барлық құрылғыны байланыстыратын өмірлік циклді ұйымдастырады: INIT кезінде конфигурация мен қауіпсіз бастапқы күй, START-тан кейін жұмыс, STOP не ақауда тазалау. <code>LinearOpMode</code> ішінде <code>waitForStart()</code>, <code>opModeIsActive()</code> және шектелген циклдер осы тәртіпті сақтауға көмектеседі. Телеметрия әр құрылғының мәнін және жалпы тапсырма күйін бірге көрсетуі керек.</p>
    </ReadingSection>
    <ReadingSection {...readingProps(1)}>
      <p>Миссия мақсатын «оң жаққа бар» деп емес, тексерілетін нәтиже ретінде жаз: зат бастапқы ұяшықтан алынған, Claw арқылы тасылған, жеткізу аймағында босатылған және орындау аяқталған. Preconditions (алғышарттар): бастапқы орын/бағыт белгілі, зат алаңда, Claw жабық, маршрутта қабырғалар белгілі. Postconditions (соңғы шарттар): зат тиісті жерде және Claw ашық, Stop орындалған.</p>
      <p>Sequence (реттілік) пәрмендердің орнын анықтайды: алдымен Claw-ды ашу, содан кейін зат ұяшығына келу, кейін жабу. Selection (таңдау) жағдайға қарай тармақталады: алдағы ұяшық жабық болса солға бұрыл, әйтпесе алға жүр. Lab-тағы IF-OBSTACLE осы бір ғана if/else ережесін береді; ол жалпы Java тілі емес.</p>
      <p>Repetition (қайталау) команда тізімін кезекпен орындаудан көрінеді. Екі ұяшық жүру үшін екі Move Forward қосасың. Бұл Lab-та жеке цикл редакторы жоқ, сондықтан маршрутты санау оңай. Шексіз циклдің орнына ең көбі 32 пәрмен қолданылады; үш миссияның үлгі жолдары осы шектен қысқа.</p>
      <p>Robot state (робот күйі) — координата, бағыт, Claw, зат және санағыш. Task state (тапсырма күйі) — жоспарлау, орындау, үзіліс, сәтті не қате аяқталу. Мотор тоқтап тұрса да, миссия міндетті түрде сәтті емес. Әр пәрменнен бұрын күтілетін күйді кестеге жазып, Step нәтижесімен салыстыр: «(2,4), E, open → close → зат carried».</p>
    </ReadingSection>
    <ReadingSection {...readingProps(2)}>
      <p>Testing (сынау) тек дұрыс маршрутты қайталау емес. Шетке жүруді, қабырғаға бағытталған пәрменді, ерте Stop-ты, жабық Claw-ды қайта жабуды және затсыз аймаққа келуді сына. Әр жағдай үшін күтілетін нәтиже алдын ала жазылсын. Lab қате қозғалыста орындауды аяқтайды; ал зат алынбаған Close Claw-дан кейін себебін көрсетіп, келесі пәрменге өтеді.</p>
      <p>Debugging (қатені іздеп түзету) кезінде бірінші қате күйді тап. Robot бағытын, соңғы орындалған пәрменді, келесі пәрменді, live Sensor көрсеткішін және зат күйін оқы. Бұрын жасалған Read Distance кейін бұрылғанда ескірген болуы мүмкін: соңғы бақылаудың орны/бағыты сақталып көрсетіледі. IF-OBSTACLE әр орындалғанда ағымдағы алаңды қайта оқиды.</p>
      <p>Бөгетке жақындағанда жай «көбірек қуат» беру шешім емес. Нақты Sensor NaN не шектен тыс көрсетсе, <code>Double.isFinite()</code> тексеріп, қауіпсіз тоқтау тармағын қолдан. Бұл Lab-та өлшем үнемі 0…4 бүтін бос ұяшық саны: NaN моделі жоқ; ол 6-сабақта бөлек қарастырылды. Нақты роботта өлшемнің уақытын, нысан бетін және көру аймағын да тексер.</p>
      <p>Recovery (қалпына келу) үшін Pause арқылы күйді оқып, Reset арқылы бастапқы шартқа орал. Редакторға өзгеріс енгізу де оқу моделін қайта бастайды; ескі ізбен жаңа алгоритмді араластырмайсың. Reset робот пен затты модельде қайта орналастырады. Аппараттық Encoder reset тек есеп басын өзгертеді, роботты физикалық орнына апармайды. Нақты тоқтауда инерция мен жүктемеге байланысты қозғалыс жалғасуы мүмкін.</p>
    </ReadingSection>
    <ReadingSection {...readingProps(3)}>
      <p>Lab-тан нақты роботқа пәрмен тізімін тура көшіруге болмайды. Алдымен Control Hub (басқару блогы) конфигурациясында мотор типтерін, encoder қосылымдарын, стандартты Servo мен нақты Sensor моделін тексер. Құрылғы аттары <code>hardwareMap.get()</code> атауларымен дәл сәйкес болсын. REV 2m Distance Sensor қолданылса, сол құрылғының I2C қосылымын ұстан; өзге модельдің сымын болжама.</p>
      <p>Drivetrain (роботтың жүріс жүйесі) үшін екі не одан көп мотордың орналасуы, бағыты, дөңгелек диаметрі, беріліс қатынасы және Encoder counts per revolution калибрленеді. Нақты 90° бұрылыс дөңгелектер аралығы мен сырғанауға тәуелді. Бір мотордың 7-сабақ мысалы толық екіөлшемді навигация жасамайды. Бір grid ұяшығы — бекітілген сантиметр не әмбебап tick саны емес.</p>
      <p>RUN_TO_POSITION кері байланыспен нысанаға ұмтылады: target алдымен, режим содан кейін, теріс емес қуат шамасы соңынан беріледі. Әр қозғалысқа timeout, STOP тексеруі және шынайы қалдық/tolerance бағасы қажет. <code>isBusy()</code> false болуы заттың жеткізілгенін білдірмейді. Encoder білік есебін көрсетеді; абсолют робот орны мен дөңгелектің сырғанауын толық анықтамайды.</p>
      <p>Servo үшін open/closed позицияларын өз Claw механизмінде қауіпсіз шағын аралықтан тексер. 0.0 әр роботта жабық, 1.0 әр роботта ашық емес; механикалық жүріс модель мен баптауға тәуелді. Қысып қалу, жүк түсу және қуат өшкендегі күйді бағала. Алдымен көтерілген дөңгелекпен, бос механизммен, төмен қуатпен, ересек жетекші бақылауымен сына; қауіпсіздік STOP қолжетімді болсын.</p>
      <p>Бұл оқу workspace-і физикалық динамиканы, нақты сенсор шуды, батареяны, инерцияны және механизм кідірісін есептемейді. Білім нәтижесі — дұрыс алгоритм құру мен дәлелдеу. Нақты роботты жүргізуге рұқсат беретін сертификат не толық Autonomous collision avoidance (соқтығысудан автономды қорғану) жүйесі емес.</p>
    </ReadingSection>
    <IntegratedLab solved={progress.solved} onSuccess={id=>update(p=>({...p,solved:p.solved.includes(id)?p.solved:[...p.solved,id]}))} onRetry={()=>update(p=>({...p,solved:[],completed:false}))}/>
    <LessonCodeExercise id="im-code" title="Бірнеше құрылғының Java API үзінділерін толықтыр" tasks={integratedCodeTasks} answers={progress.code} onChange={(id,value)=>update(p=>({...p,code:{...p.code,[id]:value}}))}/>
    <section className="hw-panel" aria-labelledby="im-example"><h2 id="im-example" tabIndex={-1}>Аппараттық координация: түсіндірілген псевдокод</h2><p>Төмендегі жоспар — толық Java бағдарламасы емес. Айнымалылар, task enum, калибрленген drivetrain қадамдары және затты растау логикасы әдейі іске асырылмаған. Оны FTC SDK құрастырған код деп қабылдама. Мақсат — нақты SDK API шақыруларының қауіпсіз құрылымдағы орнын түсіну.</p><p>Болжам: Encoder-і бар екі DcMotor, differential drivetrain (екі жақты жүріс жүйесі), бір стандартты Servo Claw және алға қарайтын Distance Sensor. Құрылғы атауы, бағыттары, motor type, I2C/PWM/encoder қосылымдары нақты роботта тексеріледі. Left/right target, позиция толеранттылығы мен таймаут әр механизмге сай беріледі.</p><figure className="pl-code-figure"><figcaption>Аппараттық state machine жоспары · web grid-тен тәуелсіз</figcaption><pre tabIndex={0} aria-label="Құрылғыларды үйлестіру псевдокоды"><code>{coordinationPseudocode}</code></pre></figure><p>Нақты қозғалыс әдісін <a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/RobotAutoDriveByEncoder_Linear.java" target="_blank" rel="noreferrer">FIRST RobotAutoDriveByEncoder_Linear</a> үлгісімен салыстыр: онда моторлар, counts-per-distance есебі, target→mode→power реті, STOP және timeout көрсетілген. Оның өлшемдері мен мотор бағыттарын өз роботыңа тексермей көшірме. Бір моторға арналған бұрынғы мысалдар web алаңын навигацияламайды.</p><p>Соңғы <code>finally</code> мотор қуатын нөлдейді, бірақ Servo-ны қай күйге әкелу жүктемеге байланысты: автоматты ашу затты түсіріп жіберуі мүмкін. Нақты аппараттық компиляция не робот сынағы бұл сабақта орындалмайды.</p></section>
    <LessonQuiz id="im-quiz" questions={integratedQuestions} answers={progress.answers} onAnswer={(id,answer)=>update(p=>p.answers[id]!==undefined?p:{...p,answers:{...p.answers,[id]:answer}})} onRetry={()=>update(p=>({...p,answers:{},completed:false}))} retryNote="Тек тест жауаптары мен аяқтау белгісі жаңарады; теория, миссиялар, Java және жағдаят сақталады."/>
    <LessonScenario id="im-scenario" question={integratedScenario} answer={progress.scenarioAnswer} onAnswer={answer=>update(p=>p.scenarioAnswer!==undefined?p:{...p,scenarioAnswer:answer})} onRetry={()=>update(p=>({...p,scenarioAnswer:undefined,completed:false}))}/>
    <section className="hw-panel" aria-labelledby="im-completion"><h2 id="im-completion" tabIndex={-1}>Қорытынды сабақты аяқтау</h2><ul className="pl-checklist"><li>{progress.read.length===4?'✓':'○'} Теория {progress.read.length}/4</li><li>{progress.solved.length===3?'✓':'○'} Миссиялар {progress.solved.length}/3</li><li>{integratedCodeScore(progress)===5?'✓':'○'} Java {integratedCodeScore(progress)}/5</li><li>{integratedQuizPassed(progress)?'✓':'○'} Тест: барлық бес жауап, кемінде 4/5 ({Object.keys(progress.answers).length}/5 жауап; {integratedQuizScore(progress)}/5 дұрыс)</li><li>{progress.scenarioAnswer===integratedScenario.answer?'✓':'○'} Debugging жағдаяты дұрыс</li></ul><button type="button" className="hw-button" disabled={!canCompleteIntegrated(progress)||progress.completed} onClick={()=>update(p=>({...p,completed:true}))}>{progress.completed?'✓ Сабақ аяқталды':'Сабақты аяқтадым'}</button><p role="status">{progress.completed?'Қорытынды миссияны дәлелдедің! Барлық сегіз сабақтың нәтижесін Programming тізімінен қара.':'Барлық шарт орындалған соң өзің растайсың. Автоматты түрде 100% берілмейді.'}</p><p>Рефлексия: қай қате пәрменді өзгерттің? Затты жеткізгеніңді қандай күй дәлелдейді? Нақты роботта қай үш шаманы қайта тексерер едің?</p></section>
    <LessonNavigation current="integrated-challenge" pager/>
    <section className="hw-panel"><h2>Ресми дереккөздер</h2><p>Тексерілген күні: 16.11.2026. English тіліндегі құжаттар.</p><ul className="hw-list"><li><a href="https://ftc-docs.firstinspires.org/en/latest/" target="_blank" rel="noreferrer">FIRST Tech Challenge Documentation</a></li><li><a href="https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/RobotAutoDriveByEncoder_Linear.java" target="_blank" rel="noreferrer">FIRST: Auto Drive by Encoder</a></li><li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/android_studio/using_sensors/Using-Sensors-%28Android-Studio%29.html" target="_blank" rel="noreferrer">FIRST: Using Sensors</a></li><li><a href="https://ftc-docs.firstinspires.org/en/latest/programming_resources/tutorial_specific/android_studio/controlling_a_servo/Controlling-a-Servo-%28Android-Studio%29.html" target="_blank" rel="noreferrer">FIRST: Controlling a Servo</a></li></ul></section>
  </div>
}
