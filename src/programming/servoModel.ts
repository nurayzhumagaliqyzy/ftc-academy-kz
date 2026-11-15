export const servoStorageKey = 'ftc-academy-kz:programming:servo:v1'
export const servoReadings = [
  { id: 'fundamentals', title: 'Servo Motor және DC Motor: позиция мен қуат' },
  { id: 'connection', title: 'Control Hub қосылымы және конфигурация' },
  { id: 'sdk', title: 'Java: Servo, setPosition() және getPosition()' },
  { id: 'practice', title: 'Қолдану, қауіпсіздік және қатені түзету' },
] as const
export type ServoReadingId = (typeof servoReadings)[number]['id']

// Deterministic illustration only: no degrees, torque, speed or physical feedback.
export function normalizeServoPosition(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.5
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100
}
export function servoClawOutput(value: unknown) {
  const position = normalizeServoPosition(value)
  return { position, jawSpread: 8 + position * 52, command: `claw.setPosition(${position.toFixed(2)});` }
}
export const servoChallenges = [
  { id: 'target', title: '1. Нысаналы позиция', prompt: 'Слайдерді 0.25-ке қой. setPosition(0.25) пәрмені нені сұрайды?', target: 0.25,
    options: ['Білікті міндетті түрде 25°-қа бұруды', 'Қалыпталған аралықтағы 0.25 позициясына баруды', 'Минутына 25 айналымды'], answer: 1,
    explanation: '0.25 — 0…1 аралығындағы нысаналы позиция. Ол градус та, RPM (минуттағы айналым саны) да емес; нақты бұрыш модель мен баптауға тәуелді.' },
  { id: 'opening', title: '2. Екі позицияны салыстыру', prompt: 'Осы шартты Claw моделінде 0.25-тен кеңірек ашу үшін 0.75-ке қой. Неліктен жақтар кеңірек ашылды?', target: 0.75,
    options: ['Осы оқу моделінде үлкен мән кеңірек ашылуға сәйкестендірілген', 'Барлық нақты Servo-да 1.0 әрқашан толық ашық', '0.75 моторға 75% қуат береді'], answer: 0,
    explanation: 'Бұл Lab-та үлкен позиция жақтарды кеңірек ашады. Нақты механизмдегі ашық/жабық мәндер орнатылу мен бағытқа байланысты тәжірибемен анықталады; бұл әмбебап ереже емес.' },
  { id: 'diagnose', title: '3. Есептеу және диагностика', prompt: 'Осы модельде ашылуды азайт: 0.75 − 0.35 мәнін есептеп, слайдерге қой. Егер нақты жақ кептелсе де getPosition() осы мәнді қайтарса, не қорытасың?', target: 0.40,
    options: ['Жақ нысанаға міндетті түрде жетті', 'Servo тоқтады, себебі getPosition() қуатты өшіреді', 'Соңғы пәрмен 0.40 болды; нақты қозғалысты бөлек тексеру керек'], answer: 2,
    explanation: '0.75 − 0.35 = 0.40. getPosition() соңғы нысаналы пәрменді қайтарады, біліктің өлшенген орнын растамайды. Нақты механизм кептелсе, STOP беріп, қоректі ажыратып барып тексер.' },
] as const
export type ServoChallengeId = (typeof servoChallenges)[number]['id']
export function evaluateServoChallenge(id: string, position: unknown, answer: unknown) {
  const challenge = servoChallenges.find(item => item.id === id)
  if (!challenge) return { correct: false, message: 'Тапсырманы таңда.' }
  if (typeof position !== 'number' || !Number.isFinite(position) || position < 0 || position > 1 || normalizeServoPosition(position) !== challenge.target) {
    return { correct: false, message: `Позиция сәйкес емес. ${challenge.prompt} Алдымен сандық мәнді тексер.` }
  }
  if (answer !== challenge.answer) return { correct: false, message: `Позиция дұрыс, түсіндірмені қайта қара. ${challenge.explanation}` }
  return { correct: true, message: `Дұрыс! ${challenge.explanation}` }
}
export const servoCodeTasks = [
  { id: 'type', prompt: 'Стандартты позициялық Servo типін импортта.', before: 'import com.qualcomm.robotcore.hardware.', after: ';', options: ['DcMotor', 'CRServo', 'Servo'], answer: 'Servo', explanation: 'Servo — нысаналы позициямен басқарылатын стандартты Servo типі. CRServo үздіксіз айналатын Servo үшін қолданылады.' },
  { id: 'map', prompt: 'Конфигурациядағы claw атты Servo құрылғысын ал.', before: 'claw = hardwareMap.get(', after: ', "claw");', options: ['DcMotor.class', 'Servo.class', '"Servo"'], answer: 'Servo.class', explanation: 'hardwareMap.get(Servo.class, "claw") құрылғының типі мен конфигурациядағы дәл атауын қолданады. Тек порт нөмірі жеткіліксіз.' },
  { id: 'start', prompt: 'Қозғалысқа пәрмен бермес бұрын START сигналын күт.', before: '', after: '();', options: ['waitForStart', 'getPosition', 'setPosition'], answer: 'waitForStart', explanation: 'waitForStart() START-ты күтеді. Одан кейін opModeIsActive() не isStopRequested() арқылы тоқтату күйін ескер.' },
  { id: 'position', prompt: 'Servo-ға 0.75 нысаналы позициясын бер.', before: 'claw.', after: '(0.75);', options: ['setPower', 'getPosition', 'setPosition'], answer: 'setPosition', explanation: 'setPosition(0.75) нысаналы позицияны береді; RPM не 75% қуат емес. Нақты механизмге бұл мәнді алдын ала тексермей берме.' },
  { id: 'read', prompt: 'Соңғы нысаналы пәрменді telemetry үшін оқы.', before: 'double commanded = claw.', after: '();', options: ['getPosition', 'setPosition', 'getPower'], answer: 'getPosition', explanation: 'getPosition() соңғы берілген позицияны оқиды. Бұл сыртқы Sensor (датчик) арқылы алынған нақты бұрыш емес.' },
] as const
export const servoQuestions = [
  { id: 'type', prompt: 'Стандартты Servo мен CRServo айырмасы қандай?', options: ['Екеуінде де setPosition() RPM береді', 'Servo нысаналы позицияны, CRServo setPower() арқылы айналу қуаты мен бағытын басқарады', 'CRServo тек telemetry көрсетеді'], answer: 1, explanation: 'Стандартты позициялық Servo setPosition() қолданады. Continuous Rotation Servo (үздіксіз айналатын Servo) CRServo типімен және setPower() арқылы басқарылады; ол нысаналы бұрышты ұстамайды.' },
  { id: 'range', prompt: 'Стандартты Servo үшін setPosition() нысаналы мәнінің аралығы қандай?', options: ['−1…+1', '0…360', '0.0…1.0'], answer: 2, explanation: 'Позиция 0.0…1.0 аралығында беріледі. Бұл қалыпталған координата; DC Motor қуатының −1…+1 аралығымен шатастырма.' },
  { id: 'feedback', prompt: 'getPosition() нені қайтарады?', options: ['Соңғы берілген нысаналы позицияны', 'Біліктің Sensor өлшеген нақты бұрышын', 'RPM мәнін'], answer: 0, explanation: 'getPosition() пәрменді қайтарады. Қозғалыстың аяқталғанын не кептелу жоғын осы әдіспен растауға болмайды.' },
  { id: 'travel', prompt: 'setPosition(0.5) барлық Servo-да дәл 90° бере ме?', options: ['Иә, бұл Java кепілдігі', 'Жоқ, механикалық жүріс модельге, баптауға және орнатылуға тәуелді', 'Жоқ, ол әрқашан 50 RPM береді'], answer: 1, explanation: '0.5 — қалыпталған аралықтың ортасы. Мысалы 180° модельде орта шамамен 90° болуы мүмкін, бірақ барлық Servo үшін бірдей физикалық бұрыш кепілденбейді.' },
  { id: 'zero', prompt: 'claw.setPosition(0) пәрменін «қуатты өшіріп тоқтату» деуге бола ма?', options: ['Иә, барлық моторға нөл бірдей әсер етеді', 'Иә, ол Servo-ны міндетті түрде жабады', 'Жоқ, бұл шеткі нысаналы позицияға қозғалу пәрмені'], answer: 2, explanation: 'setPosition(0) Servo-ны аралықтың бір шетіне бағыттайды. Ол DcMotor.setPower(0) сияқты қуатты нөлдемейді және әмбебап қауіпсіз тоқтату емес.' },
] as const
export const servoScenario = {
  prompt: 'Жағдаят: бір claw механизмінде 0.25 — ашық, 0.75 — жабық деп тәжірибемен анықталды. Оқушы «1.0 әрқашан ашық» деп setPosition(1.0) жазды; жақ тірелді. Қалай түзетесің?',
  options: ['setPosition(-1) беріп, жылдамдығын арттыру', 'getPosition() == 1.0 болса, жақ ашық деп қабылдау', 'STOP беріп, қоректі ажыратып механизмді тексеру; кейін тексерілген 0.25 ашық мәнін қолдану'],
  answer: 2,
  explanation: 'Ашық/жабық мәндер әмбебап емес. Тірелген механизмді күштеме; алдымен STOP және қоректі ажырату қажет. Қауіпсіз шағын қадамдармен тексерілген осы механизмнің 0.25 мәнін қолдан. getPosition() нақты ашылуды өлшемейді.',
} as const
export const servoJavaExample = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.Servo;

@TeleOp(name = "ServoClaw", group = "Academy")
public class ServoClaw extends LinearOpMode {
    private Servo claw;

    @Override
    public void runOpMode() throws InterruptedException {
        claw = hardwareMap.get(Servo.class, "claw");
        telemetry.addData("Status", "Ready - check clearance");
        telemetry.update();

        waitForStart();
        if (isStopRequested()) return;

        // Illustrative targets: calibrate for your mechanism first.
        claw.setPosition(0.50);
        while (opModeIsActive()) {
            if (gamepad1.a) {
                claw.setPosition(0.75);
            } else if (gamepad1.b) {
                claw.setPosition(0.25);
            }
            telemetry.addData("Commanded position", claw.getPosition());
            telemetry.update();
            idle();
        }
    }
}`
export type ServoProgress = {
  assessmentVersion: 1
  previouslyCompleted: false
  read: ServoReadingId[]
  solved: ServoChallengeId[]
  code: Record<string, string>
  answers: Record<string, number>
  scenarioAnswer?: number
  completed: boolean
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export function servoCodeScore(progress: ServoProgress) {
  return servoCodeTasks.filter(task => progress.code[task.id] === task.answer).length
}
export function servoQuizScore(progress: ServoProgress) {
  return servoQuestions.filter(question => progress.answers[question.id] === question.answer).length
}
export function servoQuizPassed(progress: ServoProgress) {
  return servoQuestions.every(question => progress.answers[question.id] !== undefined) && servoQuizScore(progress) >= 4
}
export function canCompleteServo(progress: ServoProgress) {
  return servoReadings.every(section => progress.read.includes(section.id)) &&
    servoChallenges.every(challenge => progress.solved.includes(challenge.id)) &&
    servoCodeScore(progress) === servoCodeTasks.length && servoQuizPassed(progress) && progress.scenarioAnswer === servoScenario.answer
}
export function servoProgressPercent(progress: ServoProgress) {
  const steps = progress.read.length + progress.solved.length + Number(servoCodeScore(progress) === servoCodeTasks.length) +
    Number(servoQuizPassed(progress)) + Number(progress.scenarioAnswer === servoScenario.answer) + Number(progress.completed && canCompleteServo(progress))
  return Math.round(steps / 11 * 100)
}
export function normalizeServoProgress(value: unknown): ServoProgress {
  const progress: ServoProgress = { assessmentVersion: 1, previouslyCompleted: false, read: [], solved: [], code: {}, answers: {}, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) { const read = value.read; progress.read = servoReadings.filter(item => read.includes(item.id)).map(item => item.id) }
  if (Array.isArray(value.solved)) { const solved = value.solved; progress.solved = servoChallenges.filter(item => solved.includes(item.id)).map(item => item.id) }
  if (isRecord(value.code)) {
    for (const task of servoCodeTasks) {
      const answer = value.code[task.id]
      if (typeof answer === 'string' && task.options.some(option => option === answer)) progress.code[task.id] = answer
    }
  }
  if (isRecord(value.answers)) {
    for (const question of servoQuestions) {
      const answer = value.answers[question.id]
      if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) progress.answers[question.id] = answer
    }
  }
  const scenario = value.scenarioAnswer
  if (typeof scenario === 'number' && Number.isInteger(scenario) && scenario >= 0 && scenario < servoScenario.options.length) progress.scenarioAnswer = scenario
  progress.completed = value.completed === true && canCompleteServo(progress)
  return progress
}
export function loadServoProgress(): ServoProgress {
  try { return normalizeServoProgress(JSON.parse(localStorage.getItem(servoStorageKey) ?? 'null')) }
  catch { return normalizeServoProgress(null) }
}
export function saveServoProgress(progress: ServoProgress): boolean {
  try { localStorage.setItem(servoStorageKey, JSON.stringify(normalizeServoProgress(progress))); return true }
  catch { return false }
}
