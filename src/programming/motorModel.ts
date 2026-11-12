export const motorStorageKey = 'ftc-academy-kz:programming:dc-motor:v2'
export const legacyMotorStorageKey = 'ftc-academy-kz:programming:dc-motor:v1'
export const motorReadings = [
  { id: 'motor', title: 'DC Motor қалай жұмыс істейді?' },
  { id: 'connection', title: 'Control Hub-қа қосу' },
  { id: 'power', title: 'Қуат, бағыт және тоқтату' },
  { id: 'sdk', title: 'FTC SDK арқылы басқару' },
] as const
export type MotorReadingId = (typeof motorReadings)[number]['id']
export type MotorDirection = 'FORWARD' | 'REVERSE'

export function normalizePower(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  const power = Math.round(Math.min(1, Math.max(-1, value)) * 20) / 20
  return Object.is(power, -0) ? 0 : power
}

export function motorOutput(power: number, direction: MotorDirection, running: boolean) {
  const appliedPower = running ? normalizePower(power) : 0
  const effectivePower = appliedPower * (direction === 'REVERSE' ? -1 : 1)
  return {
    appliedPower,
    rotation: effectivePower === 0 ? 'stopped' : effectivePower > 0 ? 'clockwise' : 'counterclockwise',
    command: `motor.setDirection(DcMotorSimple.Direction.${direction});\nmotor.setPower(${appliedPower.toFixed(2)});`,
  } as const
}

export const motorChecks = [
  { id: 'forward-positive', title: '1. Оң қуат', instruction: 'FORWARD таңда, оң қуат орнат та, «Іске қосу» батырмасын бас. Негізгі бағытпен салыстырғанда мотор қалай айналады?', explanation: 'FORWARD және оң қуат негізгі логикалық бағытты береді. Сұлбада ол шартты түрде ⟳ деп көрсетілген.' },
  { id: 'reverse-negative', title: '2. Екі кері әсер', instruction: 'Тоқтат. REVERSE таңда, теріс қуат орнат та, қайта іске қос. FORWARD + оң қуатпен салыстырғанда бағыт қандай?', explanation: 'Теріс қуат бағыт әсерін кері аударады, REVERSE оны тағы кері аударады. Екі кері әсерден кейін FORWARD + оң қуаттағы негізгі бағыт шығады.' },
  { id: 'zero', title: '3. Нөлдік қуат', instruction: '«Тоқтату · setPower(0)» батырмасын бас. Енді жетек қуаты мен оқу анимациясы қандай күйде?', explanation: 'setPower(0) жетек қуатын нөлдейді. FORWARD не REVERSE баптауы нөлдік қуатты қозғалысқа айналдырмайды. Нақты механизм инерциямен қозғала алады.' },
] as const
export type MotorCheckId = (typeof motorChecks)[number]['id']
export const motorPredictions = [
  { id: 'primary', label: 'Негізгі бағытпен бірдей' },
  { id: 'opposite', label: 'Негізгі бағытқа кері' },
  { id: 'zero', label: 'Жетек қуаты нөл, анимация тоқтаған' },
] as const
export function motorLabPassed(progress: Pick<MotorProgress, 'labChecks'>) {
  return motorChecks.every(check => progress.labChecks.includes(check.id))
}
export function checkMotorUnderstanding(id: MotorCheckId, power: number, direction: MotorDirection, running: boolean, prediction: string) {
  if (!Number.isFinite(power)) return { correct: false, explanation: 'Қуат жарамды сан болуы керек. Жүгірткі арқылы −1…+1 аралығын таңда.' }
  const task = motorChecks.find(check => check.id === id)
  if (!task) return { correct: false, explanation: 'Алдымен бағалау тапсырмасын таңда.' }
  const normalized = normalizePower(power)
  const configured = id === 'forward-positive' ? running && direction === 'FORWARD' && normalized > 0 :
    id === 'reverse-negative' ? running && direction === 'REVERSE' && normalized < 0 : normalized === 0
  if (!configured) return { correct: false, explanation: id === 'forward-positive' ? 'Алдымен FORWARD және оң қуатпен анимацияны іске қос. Содан кейін бағытты таңда.' : id === 'reverse-negative' ? 'Алдымен REVERSE және теріс қуатпен анимацияны іске қос. Таңба мен баптауды бірге тексер.' : 'Алдымен «Тоқтату» батырмасын басып, таңдалған қуатты 0.00 мәніне келтір.' }
  const expected = id === 'zero' ? 'zero' : 'primary'
  const explanation = task.explanation
  return { correct: prediction === expected, explanation }
}

export const codeTasks = [
  { id: 'declare', prompt: 'DcMotor айнымалысын жарияла.', before: 'private ', after: ' motor;', options: ['DcMotor', 'DCmotor', 'Servo'], answer: 'DcMotor', explanation: 'Типтің атауы — DcMotor. Java-да бас және кіші әріптер маңызды.' },
  { id: 'map', prompt: 'Конфигурациядағы "motor" құрылғысын тап.', before: 'motor = ', after: '.get(DcMotor.class, "motor");', options: ['gamepad1', 'hardwareMap', 'telemetry'], answer: 'hardwareMap', explanation: 'hardwareMap.get() конфигурациядағы атау бойынша құрылғыны алады. "motor" атауы дәл сәйкес болуы керек.' },
  { id: 'power', prompt: 'Қуатты 0.5 мәніне орнат.', before: 'motor.', after: '(0.5);', options: ['setPosition', 'setDirection', 'setPower'], answer: 'setPower', explanation: 'setPower(0.5) қуат пәрменін береді. Бұл нақты айналу жылдамдығының өлшемі емес.' },
  { id: 'direction', prompt: 'Бағыт баптауын REVERSE етіп өзгерт.', before: 'motor.setDirection(DcMotorSimple.Direction.', after: ');', options: ['BACKWARD', 'REVERSE', 'NEGATIVE'], answer: 'REVERSE', explanation: 'Дұрыс enum мәні — REVERSE. FORWARD бағытымен салыстырғанда сол қуаттың айналу әсері кері болады.' },
  { id: 'stop', prompt: 'Моторға нөлдік қуат жібер.', before: 'motor.setPower(', after: ');', options: ['1', '-1', '0'], answer: '0', explanation: 'setPower(0) жетек қуатын нөлге қояды. Теріс қуат тоқтатпайды: ол бағытты өзгертеді.' },
] as const

export const motorQuestions = [
  { id: 'purpose', prompt: 'DC Motor не істейді?', options: ['Электр энергиясын біліктің айналуына айналдырады', 'Тек қашықтықты өлшейді', 'Java кодын сақтайды'], answer: 0, explanation: 'DC Motor электр энергиясын механикалық қозғалысқа айналдырады. Роботта ол дөңгелекті не басқа механизмді айналдыра алады.' },
  { id: 'class', prompt: 'FTC SDK-де кәдімгі DC Motor-ды басқару үшін қай тип қолданылады?', options: ['DcMotor', 'String', 'Servo'], answer: 0, explanation: 'DcMotor мотордың қуаты мен басқа параметрлеріне қол жеткізуге мүмкіндік береді. Жиі «класс» деп аталғанымен, Java API-де бұл — interface (интерфейс).' },
  { id: 'range', prompt: 'Осы сабақтағы RUN_WITHOUT_ENCODER режимінде setPower() үшін жарамды аралық қандай?', options: ['0…100', '−1.0…+1.0', '−12…+12'], answer: 1, explanation: 'Қуат пәрмені −1.0 мен +1.0 арасында. Нөл — жетек қуаты жоқ; таңба бағытқа әсер етеді. Бұл вольт не RPM емес.' },
  { id: 'direction', prompt: 'Қуат +0.5 болып қалды. FORWARD орнына REVERSE орнатсақ, не өзгереді?', options: ['Мотор міндетті түрде тоқтайды', 'Қуат +1.0 болады', 'Айналу бағыты FORWARD-пен салыстырғанда кері болады'], answer: 2, explanation: 'REVERSE сол қуат пәрменінің бағыт әсерін кері аударады. Нақты сағат тілі бағыты моторға, сымға және қай жағынан қарағаныңа байланысты.' },
  { id: 'stop', prompt: 'Бағдарламада мотордың жетек қуатын нөлге қоюдың дұрыс жолы қайсы?', options: ['motor.setPower(-1);', 'motor.setPower(0);', 'motor.setDirection(DcMotorSimple.Direction.REVERSE);'], answer: 1, explanation: 'setPower(0) қуатты нөлге қояды. BRAKE айналуға кедергі келтіреді, FLOAT еркін айналуға мүмкіндік береді. Нақты механизм инерциямен қозғала алады; толық тоқтағанын тексер.' },
] as const

export const motorJavaExample = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;

@TeleOp(name = "MotorBasics", group = "Academy")
public class MotorBasics extends LinearOpMode {
    private DcMotor motor;

    @Override
    public void runOpMode() throws InterruptedException {
        motor = hardwareMap.get(DcMotor.class, "motor");
        motor.setPower(0);
        motor.setDirection(DcMotorSimple.Direction.REVERSE);
        motor.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
        motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);

        telemetry.addData("Status", "Ready");
        telemetry.update();

        try {
            waitForStart();
            while (opModeIsActive()) {
                double power = gamepad1.a ? 0.5 : 0.0;
                motor.setPower(power);
                telemetry.addData("Power", power);
                telemetry.update();
                idle();
            }
        } finally {
            motor.setPower(0);
        }
    }
}`

export const motorScenario = {
  prompt: 'Жағдаят: FORWARD және +0.5 қуатта мотор негізгі бағытта айналды. Қуат +0.5 болып қалды, бірақ баптау REVERSE болып өзгеріп, бағыт кері айналды. Негізгі бағытқа қалай қайтарасың?',
  options: ['REVERSE жылдамдықты ғана өзгертеді; қуатты +1.0 қою керек', 'Алдымен setPower(0), содан кейін FORWARD баптауын қайтарып, +0.5 қуатты қайта беру', 'setPower(-1) арқылы моторды тоқтату'],
  answer: 1,
  explanation: 'REVERSE сол қуаттың бағыт әсерін FORWARD-пен салыстырғанда кері аударады. Қуатты нөлдеп, FORWARD орнатқаннан кейін +0.5 негізгі логикалық бағытты қайтарады. Теріс қуат тоқтату емес. Нақты сағат тілі бағыты моторға және қарау жағына байланысты.',
} as const

export type MotorProgress = {
  assessmentVersion: 2
  previouslyCompleted: boolean
  scenarioAnswer?: number
  read: MotorReadingId[]
  code: Record<string, string>
  answers: Record<string, number>
  labChecks: MotorCheckId[]
  labDone: boolean
  completed: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export function motorQuizScore(progress: MotorProgress) {
  return motorQuestions.filter(question => progress.answers[question.id] === question.answer).length
}
export function motorQuizPassed(progress: MotorProgress) {
  return motorQuestions.every(question => progress.answers[question.id] !== undefined) && motorQuizScore(progress) >= 4
}
export function motorCodeScore(progress: MotorProgress) {
  return codeTasks.filter(task => progress.code[task.id] === task.answer).length
}
function legacyCompletionRequirements(progress: MotorProgress) {
  return motorReadings.every(section => progress.read.includes(section.id)) && progress.labDone &&
    motorCodeScore(progress) === codeTasks.length && motorQuizPassed(progress)
}
export function canCompleteMotor(progress: MotorProgress) {
  return legacyCompletionRequirements(progress) && progress.scenarioAnswer === motorScenario.answer && motorLabPassed(progress)
}
export function motorProgressPercent(progress: MotorProgress) {
  const steps = progress.read.length + Number(motorLabPassed(progress)) + Number(motorCodeScore(progress) === codeTasks.length) +
    Number(motorQuizPassed(progress)) + Number(progress.scenarioAnswer === motorScenario.answer) + Number(progress.completed && canCompleteMotor(progress))
  return Math.round(steps / 9 * 100)
}
export function normalizeMotorProgress(value: unknown): MotorProgress {
  const progress: MotorProgress = { assessmentVersion: 2, previouslyCompleted: false, read: [], code: {}, answers: {}, labChecks: [], labDone: false, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) {
    const read = value.read
    progress.read = motorReadings.filter(section => read.includes(section.id)).map(section => section.id)
  }
  if (isRecord(value.code)) {
    for (const task of codeTasks) {
      const answer = value.code[task.id]
      if (typeof answer === 'string' && task.options.some(option => option === answer)) progress.code[task.id] = answer
    }
  }
  if (isRecord(value.answers)) {
    for (const question of motorQuestions) {
      const answer = value.answers[question.id]
      if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) {
        progress.answers[question.id] = answer
      }
    }
  }
  if (Array.isArray(value.labChecks)) {
    const checks = value.labChecks
    progress.labChecks = motorChecks.filter(check => checks.includes(check.id)).map(check => check.id)
  }
  progress.labDone = value.labDone === true || motorLabPassed(progress)
  const scenarioAnswer = value.scenarioAnswer
  if (typeof scenarioAnswer === 'number' && Number.isInteger(scenarioAnswer) && scenarioAnswer >= 0 && scenarioAnswer < motorScenario.options.length) progress.scenarioAnswer = scenarioAnswer
  progress.previouslyCompleted = value.previouslyCompleted === true ||
    ((value.assessmentVersion === undefined || value.assessmentVersion === 1) && value.completed === true && legacyCompletionRequirements(progress))
  progress.completed = value.completed === true && canCompleteMotor(progress)
  return progress
}
// v1 remains an untouched backup; v2 is the current assessment record.
export function loadMotorProgress(): MotorProgress {
  try {
    const current = localStorage.getItem(motorStorageKey)
    if (current !== null) {
      try { const parsed: unknown = JSON.parse(current); if (isRecord(parsed)) return normalizeMotorProgress(parsed) } catch { /* recover from the v1 backup below */ }
    }
    return normalizeMotorProgress(JSON.parse(localStorage.getItem(legacyMotorStorageKey) ?? 'null'))
  } catch { return normalizeMotorProgress(null) }
}
export function saveMotorProgress(progress: MotorProgress): boolean {
  try { localStorage.setItem(motorStorageKey, JSON.stringify(normalizeMotorProgress(progress))); return true }
  catch { return false }
}
