export const autonomousStorageKey = 'ftc-academy-kz:programming:autonomous:v1'
export const gridSize = 6
export const maxCommands = 32
export const commandOptions = [
  { id: 'forward', label: 'Алға', detail: 'Move Forward · 1 ұяшық', symbol: '↑' },
  { id: 'left', label: 'Солға 90°', detail: 'Turn Left 90°', symbol: '↶' },
  { id: 'right', label: 'Оңға 90°', detail: 'Turn Right 90°', symbol: '↷' },
  { id: 'stop', label: 'Тоқтау', detail: 'Stop · алгоритмді аяқтау', symbol: '■' },
] as const
export type PathCommand = (typeof commandOptions)[number]['id']
export type Point = { x: number; y: number }
export type Pose = Point & { direction: number }
export const directionNames = ['Солтүстік ↑', 'Шығыс →', 'Оңтүстік ↓', 'Батыс ←'] as const
export type Challenge = { id: string; title: string; description: string; hint: string; start: Pose; target: Point; walls: readonly Point[] }
export const challenges: readonly Challenge[] = [
  { id: 'straight', title: '1. Түзу жол', description: 'Бастау (1, 1), бағыт — солтүстік. Нысана (1, 3).', hint: 'Y координатасы неше ұяшыққа өсуі керек? Соңына Stop қос.', start: { x: 1, y: 1, direction: 0 }, target: { x: 1, y: 3 }, walls: [] },
  { id: 'corner', title: '2. Бұрышпен бұрылу', description: 'Бастау (1, 1), бағыт — солтүстік. Нысана (3, 3).', hint: 'Алдымен солтүстікке жылжы, содан кейін шығысқа бұрыл. Бұрылу ұяшыққа жылжытпайды.', start: { x: 1, y: 1, direction: 0 }, target: { x: 3, y: 3 }, walls: [] },
  { id: 'detour', title: '3. Кедергіні айналып өту', description: 'Бастау (4, 1), бағыт — батыс. Нысана (1, 4). Сұр ұяшықтардан өтуге болмайды.', hint: 'Батысқа бірден жүре берсең, қабырғаға тірелесің. Қабырғаның солтүстігіндегі y = 4 қатарын пайдалан.', start: { x: 4, y: 1, direction: 3 }, target: { x: 1, y: 4 }, walls: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }] },
]
export type Execution = {
  pose: Pose; angle: number; path: Point[]; nextIndex: number
  status: 'ready' | 'running' | 'paused' | 'success' | 'blocked' | 'finished' | 'stopped'
  message: string
}
export function initialExecution(challenge: Challenge): Execution {
  return { pose: { ...challenge.start }, angle: challenge.start.direction * 90, path: [{ x: challenge.start.x, y: challenge.start.y }], nextIndex: 0, status: 'ready', message: 'Пәрмендерді құрастыр да, алгоритмді іске қос.' }
}
export function atTarget(pose: Point, challenge: Challenge) {
  return pose.x === challenge.target.x && pose.y === challenge.target.y
}
export function advanceExecution(state: Execution, commands: readonly PathCommand[], challenge: Challenge): Execution {
  if (state.status !== 'running') return state
  const command = commands[state.nextIndex]
  if (command === undefined) return { ...state, status: 'finished', message: atTarget(state.pose, challenge) ? 'Нысанаға жеттің, бірақ Stop жоқ. Соңына «Тоқтау» қосып, қайта орында.' : 'Пәрмендер аяқталды. Нысанаға жетпедің: координаталар мен бағытты тексер.' }
  const nextIndex = state.nextIndex + 1
  if (command === 'stop') return { ...state, nextIndex, status: atTarget(state.pose, challenge) ? 'success' : 'stopped', message: atTarget(state.pose, challenge) ? '✓ Нысанаға жетіп, Stop арқылы аяқтадың! Тапсырма орындалды.' : `Stop орындалды, бірақ нысанаға жетпедің. Қазіргі орын: (${state.pose.x}, ${state.pose.y}). Stop-қа дейінгі пәрмендерді түзет.` }
  let pose = { ...state.pose }
  let angle = state.angle
  let path = state.path
  if (command === 'left') { pose.direction = (pose.direction + 3) % 4; angle -= 90 }
  else if (command === 'right') { pose.direction = (pose.direction + 1) % 4; angle += 90 }
  else if (command === 'forward') {
    const deltas = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }]
    const delta = deltas[pose.direction]
    if (!delta) return { ...state, status: 'blocked', message: 'Бағыт жарамсыз. Бастапқы күйге қайтар.' }
    pose = { ...pose, x: pose.x + delta.x, y: pose.y + delta.y }
    if (pose.x < 0 || pose.x >= gridSize || pose.y < 0 || pose.y >= gridSize) return { ...state, nextIndex, status: 'blocked', message: `${nextIndex}-пәрмен өрістен шығар еді. Қадам орындалмады. Бағытты не «Алға» санын түзет.` }
    if (challenge.walls.some(wall => wall.x === pose.x && wall.y === pose.y)) return { ...state, nextIndex, status: 'blocked', message: `${nextIndex}-пәрмен кедергіге тірелді. Қадам орындалмады. Кедергіні айналып өтетін жол жоспарла.` }
    path = [...path, { x: pose.x, y: pose.y }]
  } else return { ...state, status: 'blocked', message: 'Пәрмен танылмады. Алгоритмді қайта құрастыр.' }
  return { pose, angle, path, nextIndex, status: 'running', message: `${nextIndex}-пәрмен: ${commandOptions.find(option => option.id === command)?.label}. Орын (${pose.x}, ${pose.y}), ${directionNames[pose.direction]}.${atTarget(pose, challenge) ? ' Нысанаға жеттің! Осы жерде Stop арқылы аяқта.' : ''}` }
}

export const autonomousReadings = [
  { id: 'mode', title: 'Autonomous қалай жұмыс істейді?' },
  { id: 'structure', title: 'Бағдарламаның орындалу реті' },
  { id: 'time', title: 'Уақытпен басқару және Encoder' },
  { id: 'planning', title: 'Алгоритмді жоспарлау және қатені түзету' },
] as const
export type AutonomousReadingId = (typeof autonomousReadings)[number]['id']
export const autonomousCodeTasks = [
  { id: 'annotation', prompt: 'OpMode-ты Autonomous тізіміне енгіз.', before: '@', after: '(name = "TimedMotor", group = "Academy")', options: ['TeleOp', 'Autonomous', 'DcMotor'], answer: 'Autonomous', explanation: '@Autonomous осы бағдарламаны Autonomous OpMode ретінде белгілейді. Ол маршрутты өздігінен жасамайды.' },
  { id: 'start', prompt: 'Driver Station-тан START белгісін күт.', before: '', after: '();', options: ['waitForStart', 'sleep', 'setPower'], answer: 'waitForStart', explanation: 'waitForStart() START-ты күтеді. Қозғалыс пәрмендері осы шақырудан кейін орындалуы керек.' },
  { id: 'active', prompt: 'OpMode әлі белсенді екенін тексер.', before: 'if (', after: ') {', options: ['true', 'opModeIsActive()', 'motor.isBusy()'], answer: 'opModeIsActive()', explanation: 'opModeIsActive() белсенділік күйін тексереді. true STOP-ты ескермейді; motor.isBusy() OpMode күйі емес, мотордың мақсатқа жету күйіне қатысты.' },
  { id: 'power', prompt: 'Моторға 0.3 қуат пәрменін бер.', before: 'motor.', after: '(0.3);', options: ['setPosition', 'setDirection', 'setPower'], answer: 'setPower', explanation: 'setPower(0.3) жетек қуатын орнатады. Бұл нақты RPM не жүрілген қашықтық емес.' },
  { id: 'duration', prompt: 'Ағымдағы әрекетті 1000 миллисекундқа жалғастыру үшін күт.', before: '', after: '(1000);', options: ['sleep', 'waitForStart', 'telemetry.update'], answer: 'sleep', explanation: 'sleep(1000) шамамен 1 секунд күтеді; моторға берілген қуат сол уақытта сақталады. sleep() моторды өздігінен тоқтатпайды, одан кейін setPower(0) керек. STOP орындалу уақытын қысқартуы мүмкін.' },
  { id: 'stop', prompt: 'Мотордың жетек қуатын нөлге қой.', before: 'motor.setPower(', after: ');', options: ['-1', '0', '1'], answer: '0', explanation: 'setPower(0) жетек қуатын нөлге қояды. −1 кері бағытта қуат береді, тоқтатпайды. Нақты білік инерциямен қозғала алады.' },
] as const
export const autonomousQuestions = [
  { id: 'mode', prompt: 'Autonomous пен TeleOp айырмасы қандай?', options: ['Autonomous алдын ала жазылған логикамен орындалады; TeleOp оператордың ағымдағы кірісін пайдаланады', 'Autonomous-та Java коды болмайды', 'TeleOp тек уақытпен жұмыс істейді'], answer: 0, explanation: 'Autonomous оператордың үздіксіз Gamepad басқаруынсыз алгоритмді орындайды. TeleOp оператор әрекетіне жауап береді. Екеуі де бағдарламаны және сенсорларды пайдалана алады.' },
  { id: 'annotation', prompt: '@Autonomous не істейді?', options: ['Роботты бірден іске қосады', 'Дәл қашықтықты есептейді', 'OpMode-ты Autonomous бағдарламасы ретінде белгілейді'], answer: 2, explanation: '@Autonomous бағдарлама түрі мен атауын белгілейді. Маршрут пен қозғалыс логикасын өзің жазасың; іске қосу үшін START қажет.' },
  { id: 'start', prompt: 'waitForStart() қызметі қандай?', options: ['Моторды бір секундқа іске қосу', 'Driver Station-тағы START белгісін күту', 'Барлық қателерді түзету'], answer: 1, explanation: 'waitForStart() бағдарламаның START-қа дейін қозғалысқа көшпеуіне көмектеседі. Одан кейін opModeIsActive() арқылы STOP берілмегенін тексер.' },
  { id: 'stop', prompt: 'Бағдарлама аяқталғанда мотор қуатын қауіпсіз нөлдеудің дұрыс мысалы қайсы?', options: ['finally { motor.setPower(0); }', 'motor.setPower(-1);', 'sleep(0);'], answer: 0, explanation: 'finally орындалу блогынан шыққанда нөлдік қуат пәрменін жібереді. Теріс қуат не нөл уақыт күту моторды тоқтатпайды. Қоректің жоғалуын Java коды басқара алмайды.' },
  { id: 'time', prompt: 'Бірдей қуат пен sleep(1000) әр сынақта дәл бірдей қашықтық бере ме?', options: ['Иә, әрқашан бір ұяшыққа тең', 'Иә, батареяға тәуелсіз', 'Жоқ: мотор, жүктеме, батарея және сырғанау нәтижеге әсер етеді'], answer: 2, explanation: 'Уақытпен басқару шамамен нәтиже береді. Encoder білік айналымын өлшеп, кері байланыс береді; ол дәлдікті жақсарта алады, бірақ дөңгелек сырғанауын және барлық қатені жоймайды.' },
] as const

export const autonomousJavaLines = [
  ['package org.firstinspires.ftc.teamcode;', 'Файлдың FTC жобасындағы пакет атауы.'],
  ['', ''],
  ['import com.qualcomm.robotcore.eventloop.opmode.Autonomous;', 'Autonomous аннотациясын қосады.'],
  ['import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;', 'LinearOpMode құрылымын қосады.'],
  ['import com.qualcomm.robotcore.hardware.DcMotor;', 'Моторға арналған DcMotor типін қосады.'],
  ['import com.qualcomm.robotcore.hardware.DcMotorSimple;', 'Бағыт баптауындағы DcMotorSimple типін қосады.'],
  ['', ''],
  ['@Autonomous(name = "TimedMotor", group = "Academy")', 'TimedMotor атауын Autonomous бағдарламаларының тізіміне енгізеді.'],
  ['public class TimedMotor extends LinearOpMode {', 'Файл атауы TimedMotor.java болуы керек. Класс LinearOpMode-тан орындалу құрылымын алады.'],
  ['    private DcMotor motor;', 'Бір моторға сілтеме сақтайтын айнымалыны жариялайды.'],
  ['', ''],
  ['    @Override', 'Келесі әдіс SDK-дегі әдісті жүзеге асыратынын көрсетеді.'],
  ['    public void runOpMode() throws InterruptedException {', 'OpMode-тың негізгі әдісін ашады. InterruptedException орындалудың үзілуіне қатысты.'],
  ['        motor = hardwareMap.get(DcMotor.class, "motor");', 'Конфигурациядан motor атаулы моторды алады. Бас және кіші әріптер дәл сәйкес болсын.'],
  ['        motor.setPower(0);', 'Дайындау кезінде жетек қуатын нөлдейді.'],
  ['        motor.setDirection(DcMotorSimple.Direction.FORWARD);', 'Мотордың негізгі логикалық бағытын таңдайды.'],
  ['        motor.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);', 'Осы мысалда Encoder кері байланысынсыз қуатпен басқаруды таңдайды.'],
  ['        motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);', 'Нөлдік қуатта еркін айналуға кедергі келтіреді. Бұл позицияны ұстайтын реттегіш емес.'],
  ['        telemetry.addData("Status", "Ready");', 'Оператор экранына дайындау күйі туралы дерек қосады.'],
  ['        telemetry.update();', 'Деректі Driver Station-қа жібереді.'],
  ['', ''],
  ['        try {', 'Соңында міндетті тазалау орындалатын әрекеттер блогын ашады.'],
  ['            waitForStart();', 'START белгісін күтеді. Оған дейін қозғалыс пәрмені берілмейді.'],
  ['            if (!opModeIsActive()) return;', 'OpMode белсенді болмаса, әдістен шығады; finally блогы бәрібір орындалады.'],
  ['            motor.setPower(0.3);', 'Бекітілген бір моторға 0.3 қуат береді. Бұл толық роботты жүргізу пәрмені емес.'],
  ['            sleep(1000);', '1000 миллисекунд — шамамен 1 секунд күтеді. Мотор қуаты күту кезінде сақталады; STOP күту уақытын қысқартуы мүмкін.'],
  ['            motor.setPower(0);', 'Күтуден кейін жетек қуатын нөлге қояды. Нақты білік инерциямен қозғала алады.'],
  ['            if (opModeIsActive()) {', 'Соңғы хабарды жібермес бұрын белсенділікті қайта тексереді.'],
  ['                telemetry.addData("Status", "Done");', 'Әрекеттің аяқталғанын дерекке қосады.'],
  ['                telemetry.update();', 'Аяқталу дерегін оператор экранына жібереді.'],
  ['            }', 'Соңғы хабарға арналған if блогын жабады.'],
  ['        } finally {', 'Қалыпты аяқталғанда, return не ерекше жағдай кезінде осы орындалу блогынан шыққан соң тазалауға көшеді.'],
  ['            motor.setPower(0);', 'Тазалау кезінде қуатты қайта нөлдейді. Қорек жоғалуы сияқты жағдайларды Java коды басқара алмайды.'],
  ['        }', 'finally блогын жабады.'],
  ['    }', 'runOpMode() әдісін жабады.'],
  ['}', 'TimedMotor класын жабады.'],
] as const
export const autonomousJavaExample = autonomousJavaLines.map(([line]) => line).join('\n')

export type AutonomousProgress = {
  read: AutonomousReadingId[]; solved: string[]; code: Record<string, string>; answers: Record<string, number>; completed: boolean
}
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }
export function autonomousCodeScore(progress: AutonomousProgress) { return autonomousCodeTasks.filter(task => progress.code[task.id] === task.answer).length }
export function autonomousQuizScore(progress: AutonomousProgress) { return autonomousQuestions.filter(question => progress.answers[question.id] === question.answer).length }
export function autonomousQuizPassed(progress: AutonomousProgress) { return autonomousQuestions.every(question => progress.answers[question.id] !== undefined) && autonomousQuizScore(progress) >= 4 }
export function canCompleteAutonomous(progress: AutonomousProgress) {
  return autonomousReadings.every(section => progress.read.includes(section.id)) && challenges.every(challenge => progress.solved.includes(challenge.id)) && autonomousCodeScore(progress) === autonomousCodeTasks.length && autonomousQuizPassed(progress)
}
export function autonomousProgressPercent(progress: AutonomousProgress) {
  return Math.round((progress.read.length + progress.solved.length + Number(autonomousCodeScore(progress) === autonomousCodeTasks.length) + Number(autonomousQuizPassed(progress)) + Number(progress.completed && canCompleteAutonomous(progress))) / 10 * 100)
}
export function normalizeAutonomousProgress(value: unknown): AutonomousProgress {
  const progress: AutonomousProgress = { read: [], solved: [], code: {}, answers: {}, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) { const read = value.read; progress.read = autonomousReadings.filter(section => read.includes(section.id)).map(section => section.id) }
  if (Array.isArray(value.solved)) { const solved = value.solved; progress.solved = challenges.filter(challenge => solved.includes(challenge.id)).map(challenge => challenge.id) }
  if (isRecord(value.code)) for (const task of autonomousCodeTasks) {
    const answer = value.code[task.id]
    if (typeof answer === 'string' && task.options.some(option => option === answer)) progress.code[task.id] = answer
  }
  if (isRecord(value.answers)) for (const question of autonomousQuestions) {
    const answer = value.answers[question.id]
    if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) progress.answers[question.id] = answer
  }
  progress.completed = value.completed === true && canCompleteAutonomous(progress)
  return progress
}
export function loadAutonomousProgress(): AutonomousProgress {
  try { return normalizeAutonomousProgress(JSON.parse(localStorage.getItem(autonomousStorageKey) ?? 'null')) } catch { return normalizeAutonomousProgress(null) }
}
export function saveAutonomousProgress(progress: AutonomousProgress) {
  try { localStorage.setItem(autonomousStorageKey, JSON.stringify(progress)); return true } catch { return false }
}
