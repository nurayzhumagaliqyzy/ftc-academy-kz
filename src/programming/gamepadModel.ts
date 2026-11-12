export const gamepadStorageKey = 'ftc-academy-kz:programming:gamepad-teleop:v2'
export const legacyGamepadStorageKey = 'ftc-academy-kz:programming:gamepad-teleop:v1'
export const gamepadReadings = [
  { id: 'controller', title: 'Gamepad және Driver Station' },
  { id: 'modes', title: 'TeleOp пен Autonomous айырмасы' },
  { id: 'joystick', title: 'Joystick мәнін түсіну' },
  { id: 'logic', title: 'Кіріс → есептеу → мотор' },
] as const
export type GamepadReadingId = (typeof gamepadReadings)[number]['id']

export function normalizeJoystick(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  const result = Math.round(Math.max(-1, Math.min(1, value)) * 100) / 100
  return Object.is(result, -0) ? 0 : result
}
export function joystickFromPointer(clientY: number, top: number, height: number) {
  if (![clientY, top, height].every(Number.isFinite) || height <= 64) return 0
  return normalizeJoystick((clientY - top - height / 2) / (height / 2 - 32))
}
export function gamepadOutput(value: unknown) {
  const y = normalizeJoystick(value)
  const power = y === 0 ? 0 : -y
  return { y, power, rotation: power === 0 ? 'stopped' : power > 0 ? 'clockwise' : 'counterclockwise',
    command: `double power = -gamepad1.left_stick_y;\nmotor.setPower(power);`,
  } as const
}
export const gamepadCodeTasks = [
  { id: 'read', prompt: 'Бірінші Gamepad-тың сол тетігінің Y мәнін оқы.', before: 'double y = ', after: ';', options: ['gamepad1.left_stick_y', 'gamepad2.right_stick_x', 'motor.getPower()'], answer: 'gamepad1.left_stick_y', explanation: 'gamepad1 — бірінші контроллер. left_stick_y — сол тетіктің тік осі; right_stick_x басқа тетік пен оське жатады. motor.getPower() тетікті оқымайды, моторға берілген қуат мәнін қайтарады.' },
  { id: 'invert', prompt: 'Тетікті алға итергенде оң қуат алу үшін Y таңбасын өзгерт.', before: 'double power = ', after: ';', options: ['gamepad1.left_stick_y', '-gamepad1.left_stick_y', 'gamepad1.left_stick_y * 100'], answer: '-gamepad1.left_stick_y', explanation: 'Алға итеру теріс Y береді. Минус таңбасы −0.6 мәнін +0.6 қуатқа айналдырады; 100-ге көбейту жарамды аралықтан асыруы мүмкін.' },
  { id: 'power', prompt: 'Есептелген power мәнін моторға бер.', before: 'motor.', after: '(power);', options: ['setDirection', 'setPosition', 'setPower'], answer: 'setPower', explanation: 'setPower(power) мотордың қуат пәрменін жаңартады. setDirection қуат емес, логикалық бағыт баптауы үшін қолданылады.' },
  { id: 'telemetry', prompt: 'telemetry.addData() арқылы қосылған деректерді Driver Station-қа жібер.', before: 'telemetry.', after: '();', options: ['update', 'setPower', 'waitForStart'], answer: 'update', explanation: 'telemetry.addData() деректі дайындайды, ал telemetry.update() оны жібереді. Экранға жаңа мән шығу үшін екеуі де қажет.' },
  { id: 'stop', prompt: 'OpMode аяқталғанда мотордың жетек қуатын нөлге қой.', before: 'motor.setPower(', after: ');', options: ['-1', '1', '0'], answer: '0', explanation: 'setPower(0) жетек қуатын нөлге қояды. −1 кері бағытта толық қуат береді, сондықтан тоқтату пәрмені емес.' },
] as const
export const gamepadQuestions = [
  { id: 'purpose', prompt: 'Gamepad не үшін қажет?', options: ['Моторға тікелей қорек беру үшін', 'Оператордың тетік пен батырма әрекеттерін бағдарламаға жеткізу үшін', 'Java кодын құрастыру үшін'], answer: 1, explanation: 'Gamepad оператордың әрекетін кіріс деректеріне айналдырады. Бағдарлама осы деректерді оқып, роботқа пәрмен береді; контроллер моторды қоректендірмейді.' },
  { id: 'mode', prompt: 'TeleOp пен Autonomous арасындағы негізгі айырма қандай?', options: ['TeleOp оператордың ағымдағы кірісін пайдаланады; Autonomous тапсырманы алдын ала жазылған логикамен орындайды', 'Autonomous-та бағдарлама болмайды', 'TeleOp тек сенсорлармен жұмыс істейді'], answer: 0, explanation: 'TeleOp кезінде оператор басқарады. Autonomous оператордың үздіксіз Gamepad басқаруынсыз бағдарламаға сүйенеді. Екі режим де сенсорларды қолдана алады.' },
  { id: 'axis', prompt: 'gamepad1.left_stick_y нені білдіреді?', options: ['Екінші контроллердің A батырмасын', 'Мотордың нақты RPM мәнін', 'Бірінші контроллердің сол тетігінің тік ось мәнін'], answer: 2, explanation: 'gamepad1 — бірінші Gamepad, left_stick — сол тетік, y — тік ось. Мәні −1.0…+1.0 аралығында болады.' },
  { id: 'sign', prompt: 'Тетік алға итеріліп, left_stick_y = −0.7 болды. power = -gamepad1.left_stick_y нәтижесі қандай?', options: ['−0.7', '+0.7', '0'], answer: 1, explanation: 'Минус теріс санның таңбасын өзгертеді: −(−0.7) = +0.7. Сондықтан алға итеру бұл мысалда оң қуат береді.' },
  { id: 'motor', prompt: 'Есептелген power мәнімен моторды басқарудың дұрыс жолы қайсы?', options: ['motor.setPower(power);', 'telemetry.update(power);', 'gamepad1.setPower(power);'], answer: 0, explanation: 'motor.setPower(power) қуат пәрменін моторға береді. telemetry тек дерек көрсетеді; Gamepad — кіріс құрылғысы. Нөлдік power жетек қуатын тоқтатады.' },
] as const
export const gamepadJavaExample = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;

@TeleOp(name = "GamepadMotor", group = "Academy")
public class GamepadMotor extends LinearOpMode {
    private DcMotor motor;

    @Override
    public void runOpMode() throws InterruptedException {
        motor = hardwareMap.get(DcMotor.class, "motor");
        motor.setPower(0);
        motor.setDirection(DcMotorSimple.Direction.FORWARD);
        motor.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
        motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
        telemetry.addData("Status", "Ready");
        telemetry.update();

        try {
            waitForStart();
            while (opModeIsActive()) {
                double power = -gamepad1.left_stick_y;
                motor.setPower(power);
                telemetry.addData("Left Y", gamepad1.left_stick_y);
                telemetry.addData("Power", power);
                telemetry.update();
                idle();
            }
        } finally {
            motor.setPower(0);
        }
    }
}`

export const gamepadScenario = {
  prompt: 'Жағдаят: сол Joystick (басқару тетігі) артқа тартылып, gamepad1.left_stick_y = +0.6 болды. double power = -gamepad1.left_stick_y; орындалды. FORWARD баптауында қандай пәрмен беріледі?',
  options: ['motor.setPower(0.6); — негізгі бағыт', 'motor.setPower(0); — тетік артқа тартылса мотор тоқтайды', 'motor.setPower(-0.6); — негізгі бағытқа кері'],
  answer: 2,
  explanation: 'power = −(+0.6) = −0.6. FORWARD баптауында теріс қуат негізгі логикалық бағытқа кері әсер етеді. Бұл RPM емес; нөлдік қуат тетік ортасында Y = 0 болғанда шығады. Нақты айналу бағыты мотордың орнатылуына да байланысты.',
} as const

export type GamepadProgress = {
  assessmentVersion: 2
  previouslyCompleted: boolean
  scenarioAnswer?: number
  read: GamepadReadingId[]
  code: Record<string, string>
  answers: Record<string, number>
  labDone: boolean
  completed: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export function gamepadQuizScore(progress: GamepadProgress) {
  return gamepadQuestions.filter(question => progress.answers[question.id] === question.answer).length
}
export function gamepadQuizPassed(progress: GamepadProgress) {
  return gamepadQuestions.every(question => progress.answers[question.id] !== undefined) && gamepadQuizScore(progress) >= 4
}
export function gamepadCodeScore(progress: GamepadProgress) {
  return gamepadCodeTasks.filter(task => progress.code[task.id] === task.answer).length
}
function legacyCompletionRequirements(progress: GamepadProgress) {
  return gamepadReadings.every(section => progress.read.includes(section.id)) && progress.labDone &&
    gamepadCodeScore(progress) === gamepadCodeTasks.length && gamepadQuizPassed(progress)
}
export function canCompleteGamepad(progress: GamepadProgress) {
  return legacyCompletionRequirements(progress) && progress.scenarioAnswer === gamepadScenario.answer
}
export function gamepadProgressPercent(progress: GamepadProgress) {
  const steps = progress.read.length + Number(progress.labDone) + Number(gamepadCodeScore(progress) === gamepadCodeTasks.length) +
    Number(gamepadQuizPassed(progress)) + Number(progress.scenarioAnswer === gamepadScenario.answer) + Number(progress.completed && canCompleteGamepad(progress))
  return Math.round(steps / 9 * 100)
}
export function normalizeGamepadProgress(value: unknown): GamepadProgress {
  const progress: GamepadProgress = { assessmentVersion: 2, previouslyCompleted: false, read: [], code: {}, answers: {}, labDone: false, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) {
    const read = value.read
    progress.read = gamepadReadings.filter(section => read.includes(section.id)).map(section => section.id)
  }
  if (isRecord(value.code)) {
    for (const task of gamepadCodeTasks) {
      const answer = value.code[task.id]
      if (typeof answer === 'string' && task.options.some(option => option === answer)) progress.code[task.id] = answer
    }
  }
  if (isRecord(value.answers)) {
    for (const question of gamepadQuestions) {
      const answer = value.answers[question.id]
      if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) {
        progress.answers[question.id] = answer
      }
    }
  }
  progress.labDone = value.labDone === true
  const scenarioAnswer = value.scenarioAnswer
  if (typeof scenarioAnswer === 'number' && Number.isInteger(scenarioAnswer) && scenarioAnswer >= 0 && scenarioAnswer < gamepadScenario.options.length) progress.scenarioAnswer = scenarioAnswer
  progress.previouslyCompleted = value.previouslyCompleted === true ||
    ((value.assessmentVersion === undefined || value.assessmentVersion === 1) && value.completed === true && legacyCompletionRequirements(progress))
  progress.completed = value.completed === true && canCompleteGamepad(progress)
  return progress
}
// v1 remains an untouched backup; v2 is the current assessment record.
export function loadGamepadProgress(): GamepadProgress {
  try {
    const current = localStorage.getItem(gamepadStorageKey)
    if (current !== null) {
      try { const parsed: unknown = JSON.parse(current); if (isRecord(parsed)) return normalizeGamepadProgress(parsed) } catch { /* recover from the v1 backup below */ }
    }
    return normalizeGamepadProgress(JSON.parse(localStorage.getItem(legacyGamepadStorageKey) ?? 'null'))
  } catch { return normalizeGamepadProgress(null) }
}
export function saveGamepadProgress(progress: GamepadProgress): boolean {
  try { localStorage.setItem(gamepadStorageKey, JSON.stringify(normalizeGamepadProgress(progress))); return true }
  catch { return false }
}
