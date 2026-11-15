export const encoderStorageKey = 'ftc-academy-kz:programming:encoder:v1'
export const encoderReadings = [
  { id: 'ticks', title: 'Encoder: tick, білік және CPR' },
  { id: 'modes', title: 'Төрт motor run mode және пәрмен реті' },
  { id: 'api', title: 'Java: current, target және isBusy()' },
  { id: 'limits', title: 'Қалдық, нөлдеу және қауіпсіз диагностика' },
] as const
export type EncoderReadingId = (typeof encoderReadings)[number]['id']
export const ticksPerStep = 60
export const exampleOutputCPR = 560
export function parseTickInput(value: unknown, limit = 2000): number | undefined {
  if (typeof value === 'string') {
    if (!/^[+-]?\d+$/.test(value.trim())) return undefined
    value = Number(value.trim())
  }
  return typeof value === 'number' && Number.isSafeInteger(value) && Math.abs(value) <= limit ? (value === 0 ? 0 : value) : undefined
}
export type EncoderState = {
  shaftTicks: number
  zeroOffset: number
  target: number
  startCount: number
  steps: number
  resetCount: number
  status: 'ready' | 'running' | 'paused' | 'reached'
}
export function encoderCurrent(state: EncoderState) { return state.shaftTicks - state.zeroOffset }
export function encoderRemaining(state: EncoderState) { return state.target - encoderCurrent(state) }
export function encoderDirection(state: EncoderState) {
  const difference = encoderRemaining(state)
  return difference === 0 ? 'reached' : difference > 0 ? 'increase' : 'decrease'
}
export function encoderAngle(state: EncoderState) {
  // Output-shaft illustration for the explicitly chosen 560-count example, not a universal ticks-to-angle conversion.
  return ((state.shaftTicks % exampleOutputCPR) + exampleOutputCPR) % exampleOutputCPR / exampleOutputCPR * 360
}
export function initialEncoderState(current = 200, target = 800): EncoderState {
  if (parseTickInput(current) === undefined || parseTickInput(target) === undefined) throw new RangeError('Tick values must be integers in -2000..2000')
  return { shaftTicks: current, zeroOffset: 0, target, startCount: current, steps: 0, resetCount: 0, status: current === target ? 'reached' : 'ready' }
}
export function setEncoderTarget(state: EncoderState, target: unknown): EncoderState {
  const parsed = parseTickInput(target)
  if (parsed === undefined || state.status === 'running') return state
  return { ...state, target: parsed, startCount: encoderCurrent(state), steps: 0, status: encoderCurrent(state) === parsed ? 'reached' : 'ready' }
}
export function startEncoder(state: EncoderState): EncoderState {
  return { ...state, status: encoderRemaining(state) === 0 ? 'reached' : 'running' }
}
export function pauseEncoder(state: EncoderState): EncoderState {
  return state.status === 'running' ? { ...state, status: 'paused' } : state
}
export function advanceEncoder(state: EncoderState): EncoderState {
  if (state.status !== 'running') return state
  const remaining = encoderRemaining(state)
  if (remaining === 0) return { ...state, status: 'reached' }
  const delta = Math.sign(remaining) * Math.min(Math.abs(remaining), ticksPerStep)
  return { ...state, shaftTicks: state.shaftTicks + delta, steps: state.steps + 1, status: Math.abs(remaining) <= ticksPerStep ? 'reached' : 'running' }
}
export function stepEncoder(state: EncoderState): EncoderState {
  const next = advanceEncoder(startEncoder(state))
  return next.status === 'running' ? { ...next, status: 'paused' } : next
}
export function resetEncoderReference(state: EncoderState): EncoderState {
  // Reference reset changes the coordinate, never the physical shaft illustration.
  // This Lab additionally clears its old target explicitly; it does not claim SDK target semantics.
  return { ...state, zeroOffset: state.shaftTicks, target: 0, startCount: 0, steps: 0, resetCount: state.resetCount + 1, status: 'reached' }
}
export function encoderLabCode(state: EncoderState) {
  const power = state.status === 'running' ? '0.4' : '0'
  return `// Оқу моделі: current = ${encoderCurrent(state)}, remaining = ${encoderRemaining(state)} ticks\n// Нысана берілгеннен кейін ғана RUN_TO_POSITION таңдалады.\nmotor.setTargetPosition(${state.target});\nmotor.setMode(DcMotor.RunMode.RUN_TO_POSITION);\nmotor.setPower(${power});`
}
export const encoderChallenges = [
  { id: 'positive', title: '1. Оң нысана', current: 200, target: 800, difference: 600,
    prompt: '200 tick-тен 800 tick-ке дейін модельді орында. Бастапқы target − current айырмасын және дұрыс бағыт/пәрмен ретін таңда.',
    options: ['+600; tick өседі; target 800 → RUN_TO_POSITION → setPower(0.4)', '+600; алдымен RUN_TO_POSITION, кейін target 800', '−600; target 800 үшін теріс қуат қажет'], answer: 0,
    explanation: '800 − 200 = +600 tick. Көрсеткіш өседі. Алдымен setTargetPosition(800), кейін RUN_TO_POSITION және 0.4 қуат шамасы беріледі. Нақты физикалық бағыт орнатылу мен бағыт баптауына да тәуелді.' },
  { id: 'reverse', title: '2. Кемитін позиция', current: 500, target: 100, difference: -400,
    prompt: '500 tick-тен 100 tick-ке дейін модельді орында. Бастапқы айырма мен RUN_TO_POSITION үшін дұрыс түсіндірмені таңда.',
    options: ['−400; кері өзгеріс үшін setPower(-0.4) міндетті', '−400; tick кемиді; target 100 → RUN_TO_POSITION → setPower(0.4)', '+400; target пен current-ті ауыстыру керек'], answer: 1,
    explanation: '100 − 500 = −400 tick. Target current-тен төмен, сондықтан контроллер кему бағытын өзі таңдайды. RUN_TO_POSITION режимінде қуаттың теріс емес шамасы қолданылады; теріс setPower() арқылы кері жүруді үйретпейміз.' },
  { id: 'reference', title: '3. Жаңа нөлден +360', current: 0, target: 360, difference: 360,
    prompt: 'Алдымен Encoder есебін нөлде, содан кейін target = 360 орнатып орында. Жаңа нөлден бастапқы айырма қанша және 360 tick нені білдіреді?',
    options: ['+360; барлық моторда шығыс білігінің дәл бір айналымы', '+360; reset білікті физикалық бастапқы орнына бұрады', '+360; жаңа нөлден орын ауыстыру, бір айналым болуы CPR-ге тәуелді; target → режим → оң қуат'], answer: 2,
    explanation: 'Нөлден айырма +360 tick. Reset есептің басын өзгертеді, білікті қозғалтпайды. Осы сабақтың 560 tick/шығыс айналым мысалында 360/560 ≈ 0.643 айналым; 360 tick әмбебап бір айналым емес.' },
] as const
export type EncoderChallengeId = (typeof encoderChallenges)[number]['id']
export function evaluateEncoderChallenge(id: string, state: EncoderState, difference: unknown, answer: unknown) {
  const challenge = encoderChallenges.find(item => item.id === id)
  if (!challenge) return { correct: false, message: 'Тапсырманы таңда.' }
  if (state.startCount !== challenge.current || state.target !== challenge.target || (id === 'reference' && state.resetCount === 0)) {
    return { correct: false, message: `Баптау сәйкес емес. ${challenge.prompt}` }
  }
  if (parseTickInput(difference, 4000) !== challenge.difference) return { correct: false, message: `Бастапқы айырманы қайта есепте: target − current. ${challenge.target} − (${challenge.current}) = ${challenge.difference}.` }
  if (answer !== challenge.answer) return { correct: false, message: `Сан дұрыс, түсіндірмені қайта қара. ${challenge.explanation}` }
  if (state.status !== 'reached' || encoderRemaining(state) !== 0 || state.steps === 0) return { correct: false, message: 'Болжам дұрыс. Енді «Бастау» не «Бір қадам» арқылы модельді нысанаға дейін орында.' }
  return { correct: true, message: `Дұрыс! ${challenge.explanation}` }
}
export const encoderCodeTasks = [
  { id: 'current', prompt: 'Мотордың ағымдағы Encoder есебін оқы.', before: 'int current = motor.', after: '();', options: ['getTargetPosition', 'getCurrentPosition', 'getPower'], answer: 'getCurrentPosition', explanation: 'getCurrentPosition() — осы нөлдік санаққа қатысты есеп. getTargetPosition() нысананы қайтарады, ал getPower() — қуат пәрмені.' },
  { id: 'reset', prompt: 'Мотор қуаты нөл болғанда Encoder есебін нөлде.', before: 'motor.setMode(DcMotor.RunMode.', after: ');', options: ['RUN_WITHOUT_ENCODER', 'RUN_TO_POSITION', 'STOP_AND_RESET_ENCODER'], answer: 'STOP_AND_RESET_ENCODER', explanation: 'STOP_AND_RESET_ENCODER есепті нөлдейді; білікті механикалық бастапқы орынға апармайды. Әрі қарай қажет жұмыс режимін бөлек таңда.' },
  { id: 'target', prompt: 'RUN_TO_POSITION таңдамас бұрын 800 tick нысанасын бер.', before: 'motor.', after: '(800);', options: ['setTargetPosition', 'setPower', 'getCurrentPosition'], answer: 'setTargetPosition', explanation: 'setTargetPosition(800) осы есеп басына қатысты абсолют Encoder нысанасын береді. Қазіргі есепке міндетті түрде 800 қоспайды.' },
  { id: 'mode', prompt: 'Нысана берілгеннен кейін позицияға басқару режимін таңда.', before: 'motor.setMode(DcMotor.RunMode.', after: ');', options: ['RUN_WITHOUT_ENCODER', 'RUN_TO_POSITION', 'STOP_AND_RESET_ENCODER'], answer: 'RUN_TO_POSITION', explanation: 'RUN_TO_POSITION Encoder кері байланысымен target-ке ұмтылады. Реті: target → режим → теріс емес қуат шамасы.' },
  { id: 'busy', prompt: 'OpMode белсенді, timeout бітпеген кезде мотор әлі нысанаға ұмтылып тұрғанын тексер.', before: 'boolean busy = motor.', after: '();', options: ['getPower', 'isBusy', 'setTargetPosition'], answer: 'isBusy', explanation: 'isBusy() RUN_TO_POSITION орындау күйін береді. Ол нақты робот координатасын не қауіпсіздігін растамайды; STOP пен timeout шарттары да қажет. Соңында setPower(0) бер.' },
] as const
export const encoderQuestions = [
  { id: 'ticks', prompt: 'Incremental Encoder tick-тері нені көрсетеді?', options: ['Нөлдік санаққа қатысты айналу өсімін', 'Роботтың абсолют GPS орнын', 'Әрқашан сантиметрді'], answer: 0, explanation: 'Tick — білік айналуының шағын өсімін санау. Ол тікелей сантиметр емес; бастапқы санақ пен Encoder/беріліс сипаттамалары қажет.' },
  { id: 'cpr', prompt: 'Осы сабақтағы 560 counts per output revolution мысалында 280 tick неше шығыс айналымы?', options: ['280 айналым', '1 айналым', '0.5 айналым'], answer: 2, explanation: '280/560 = 0.5 шығыс айналымы. Бұл 560 саны дәл осы таңдалған мысалға тән; өз моторыңның сипаттамасын тексер.' },
  { id: 'reset', prompt: 'Білік сол орнында тұрғанда STOP_AND_RESET_ENCODER не істейді?', options: ['Білікті механикалық нөлге өзі апарады', 'Encoder есеп басын сол орынға нөлдейді', 'CPR мәнін 360-қа өзгертеді'], answer: 1, explanation: 'Нөлдеу логикалық санақты өзгертеді. Біліктің физикалық бағыты өзгермейді; бұрынғы абсолют target-тің мағынасын қайта қарау керек.' },
  { id: 'power', prompt: 'RUN_TO_POSITION: current = 500, target = 100. Қуат туралы дұрыс тұжырым қайсы?', options: ['setPower(-0.4) міндетті', 'Target-ті орнату қажет емес', 'Теріс емес 0.4 шамасын бер; бағытты target пен current анықтайды'], answer: 2, explanation: 'Қалдық −400 tick, сондықтан есеп кемиді. Бұл режимде контроллер бағытты біледі; target алдымен қойылып, қуат теріс емес шама ретінде беріледі.' },
  { id: 'actual', prompt: 'getTargetPosition() = 800, getCurrentPosition() = 740. Не қорытасың?', options: ['Әр моторда дөңгелек дәл 60 см жүруі керек', 'Encoder қалдығы +60 tick; бұл нақты робот орнының кепілі емес', 'Нысанаға міндетті түрде жетті'], answer: 1, explanation: '800 − 740 = +60 tick. Target — пәрмен, current — Encoder есебі. Нақты орынға әсер ететін беріліс, сырғанау мен механикалық қателер бөлек.' },
] as const
export const encoderScenario = {
  prompt: 'Жағдаят: current = 500 tick кезінде оқушы reset жасады. Бұрынғы нөлге қатысты 800 нысанасын өзгертпей қайта берді. Ол бұрын жоспарланған +300 tick орнына жаңа нөлден +800 tick сұрады. Бұрынғы ниетті қалай сақтайсың?',
  options: ['RUN_TO_POSITION ішінде теріс қуат беру', 'Reset білікті физикалық 0-ге апарды деп қабылдау', 'Жаңа нөлден target = 300 беру; не reset жасамай бұрынғы нөлге қатысты 800-ді қолдану'], answer: 2,
  explanation: 'Reset алдында қалдық 800 − 500 = +300. Reset-тен кейін current = 0, сондықтан сол ниетке target = 300 керек. Жаңа нөлге ескі 800 санын көшіру мағынаны өзгертеді. Бағытты қуат таңбасымен түзету бұл координата қатесін шешпейді.',
} as const
export const encoderJavaExample = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.util.ElapsedTime;

@Autonomous(name = "EncoderPosition", group = "Academy")
public class EncoderPosition extends LinearOpMode {
    private DcMotor motor;

    @Override
    public void runOpMode() throws InterruptedException {
        motor = hardwareMap.get(DcMotor.class, "motor");
        motor.setPower(0);
        try {
            motor.setDirection(DcMotorSimple.Direction.FORWARD);
            motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
            motor.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);
            motor.setMode(DcMotor.RunMode.RUN_USING_ENCODER);
            telemetry.addData("Current ticks", motor.getCurrentPosition());
            telemetry.update();

            waitForStart();
            if (!opModeIsActive()) return;

            final int targetTicks = 560;
            final int toleranceTicks = 10;
            final double timeoutSeconds = 5.0;
            ElapsedTime timer = new ElapsedTime();
            motor.setTargetPosition(targetTicks);
            motor.setMode(DcMotor.RunMode.RUN_TO_POSITION);
            timer.reset();
            motor.setPower(0.4);

            while (opModeIsActive() && motor.isBusy()
                    && Math.abs(targetTicks - motor.getCurrentPosition()) > toleranceTicks
                    && timer.seconds() < timeoutSeconds) {
                int current = motor.getCurrentPosition();
                telemetry.addData("Target ticks", motor.getTargetPosition());
                telemetry.addData("Current ticks", current);
                telemetry.addData("Remaining ticks", targetTicks - current);
                telemetry.update();
                idle();
            }
            motor.setPower(0);
            int remaining = targetTicks - motor.getCurrentPosition();
            if (opModeIsActive()) {
                String result = Math.abs(remaining) <= toleranceTicks
                        ? "Within application tolerance"
                        : timer.seconds() >= timeoutSeconds
                        ? "Timeout - inspect mechanism"
                        : "Controller not busy - verify encoder";
                telemetry.addData("Result", result);
                telemetry.addData("Remaining ticks", remaining);
                telemetry.update();
            }
        } finally {
            motor.setPower(0);
            motor.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
        }
    }
}`
export type EncoderProgress = {
  assessmentVersion: 1
  previouslyCompleted: false
  read: EncoderReadingId[]
  solved: EncoderChallengeId[]
  code: Record<string, string>
  answers: Record<string, number>
  scenarioAnswer?: number
  completed: boolean
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export function encoderCodeScore(progress: EncoderProgress) {
  return encoderCodeTasks.filter(task => progress.code[task.id] === task.answer).length
}
export function encoderQuizScore(progress: EncoderProgress) {
  return encoderQuestions.filter(question => progress.answers[question.id] === question.answer).length
}
export function encoderQuizPassed(progress: EncoderProgress) {
  return encoderQuestions.every(question => progress.answers[question.id] !== undefined) && encoderQuizScore(progress) >= 4
}
export function canCompleteEncoder(progress: EncoderProgress) {
  return encoderReadings.every(section => progress.read.includes(section.id)) &&
    encoderChallenges.every(challenge => progress.solved.includes(challenge.id)) &&
    encoderCodeScore(progress) === encoderCodeTasks.length && encoderQuizPassed(progress) && progress.scenarioAnswer === encoderScenario.answer
}
export function encoderProgressPercent(progress: EncoderProgress) {
  const steps = progress.read.length + progress.solved.length + Number(encoderCodeScore(progress) === encoderCodeTasks.length) +
    Number(encoderQuizPassed(progress)) + Number(progress.scenarioAnswer === encoderScenario.answer) + Number(progress.completed && canCompleteEncoder(progress))
  return Math.round(steps / 11 * 100)
}
export function normalizeEncoderProgress(value: unknown): EncoderProgress {
  const progress: EncoderProgress = { assessmentVersion: 1, previouslyCompleted: false, read: [], solved: [], code: {}, answers: {}, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) { const read = value.read; progress.read = encoderReadings.filter(item => read.includes(item.id)).map(item => item.id) }
  if (Array.isArray(value.solved)) { const solved = value.solved; progress.solved = encoderChallenges.filter(item => solved.includes(item.id)).map(item => item.id) }
  if (isRecord(value.code)) {
    for (const task of encoderCodeTasks) {
      const answer = value.code[task.id]
      if (typeof answer === 'string' && task.options.some(option => option === answer)) progress.code[task.id] = answer
    }
  }
  if (isRecord(value.answers)) {
    for (const question of encoderQuestions) {
      const answer = value.answers[question.id]
      if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) progress.answers[question.id] = answer
    }
  }
  const scenario = value.scenarioAnswer
  if (typeof scenario === 'number' && Number.isInteger(scenario) && scenario >= 0 && scenario < encoderScenario.options.length) progress.scenarioAnswer = scenario
  progress.completed = value.completed === true && canCompleteEncoder(progress)
  return progress
}
export function loadEncoderProgress(): EncoderProgress {
  try { return normalizeEncoderProgress(JSON.parse(localStorage.getItem(encoderStorageKey) ?? 'null')) }
  catch { return normalizeEncoderProgress(null) }
}
export function saveEncoderProgress(progress: EncoderProgress): boolean {
  try { localStorage.setItem(encoderStorageKey, JSON.stringify(normalizeEncoderProgress(progress))); return true }
  catch { return false }
}
