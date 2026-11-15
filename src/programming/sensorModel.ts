export const sensorStorageKey = 'ftc-academy-kz:programming:sensors:v1'
export const sensorReadings = [
  { id: 'feedback', title: 'Sensor: өлшеу және кері байланыс' },
  { id: 'connection', title: 'REV 2m Distance Sensor: қосу және баптау' },
  { id: 'conditions', title: 'Java: қашықтық, double және if/else' },
  { id: 'obstacle', title: 'Кедергіні анықтау және тоқтату пәрмені' },
] as const
export type SensorReadingId = (typeof sensorReadings)[number]['id']

// Slider helpers only. Raw sensor readings must NOT be rounded/clamped before comparison.
export function normalizeLabDistance(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(5, Math.min(100, value))) : 40
}
export function normalizeStopThreshold(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(5, Math.min(50, value))) : 20
}
export function obstacleOutput(distanceCm: unknown, stopDistanceCm: unknown) {
  const finite = typeof distanceCm === 'number' && Number.isFinite(distanceCm)
  const thresholdValid = typeof stopDistanceCm === 'number' && Number.isFinite(stopDistanceCm) && stopDistanceCm > 0
  const reason = !thresholdValid ? 'invalid-threshold' : !finite ? 'invalid' : distanceCm <= stopDistanceCm ? 'obstacle' : 'clear'
  const power = reason === 'clear' ? 0.3 : 0
  const message = reason === 'invalid-threshold' ? 'Шек жарамсыз: оқу контроллері нөлдік қуат пәрменін таңдайды.' :
    reason === 'invalid' ? 'Көрсеткіш жарамсыз: қашықтық белгісіз. Осы оқу мысалында сақтық үшін setPower(0) таңдалады.' :
    reason === 'obstacle' ? `${distanceCm} см ≤ ${stopDistanceCm} см: шарт true, setPower(0) пәрмені беріледі.` :
    `${distanceCm} см > ${stopDistanceCm} см: шарт false, else тармағы setPower(0.3) пәрменін береді.`
  return { finite, reason, power, message } as const
}
export function sensorLabCode(stopDistanceCm: unknown) {
  const threshold = normalizeStopThreshold(stopDistanceCm)
  return `double stopDistanceCm = ${threshold.toFixed(1)};\ndouble distanceCm = sensor.getDistance(DistanceUnit.CM);\n\nif (!Double.isFinite(distanceCm) || distanceCm <= stopDistanceCm) {\n    motor.setPower(0);\n} else {\n    motor.setPower(0.3);\n}`
}
export const sensorChallenges = [
  { id: 'detect', title: '1. Кедергіні анықтау', distance: 15, threshold: 20, invalid: false,
    prompt: 'Шек — 20 см, көрсеткіш — 15 см. Осы мәндерді қойып, мотор пәрмені мен себебін таңда.', action: 'stop',
    explanations: ['15 ≤ 20, сондықтан нөлдік қуат пәрмені қажет', '15 > 20, сондықтан 0.3 қуат қажет', 'Датчиктің өзі мотор қорегін ажыратады'], answer: 0,
    explanation: '15 ≤ 20 — true. if тармағы motor.setPower(0) береді. Датчик тек дерек береді; шешімді бағдарлама қабылдайды. Нақты біліктің бірден тоқтауы кепілденбейді.' },
  { id: 'boundary', title: '2. Дәл шектегі мән', distance: 20, threshold: 20, invalid: false,
    prompt: 'Шек пен көрсеткіштің екеуі де 20 см. Тең болғанда не орындалатынын тексер.', action: 'stop',
    explanations: ['Тек < қолданылғандықтан, теңдік else-ке өтеді', '20 ≤ 20 — true; теңдік те тоқтату шартына кіреді', '20 см мотор қуатының 20% екенін білдіреді'], answer: 1,
    explanation: 'Кодта < емес, <= жазылған: 20 ≤ 20 — true. Сондықтан нөлдік қуат пәрмені беріледі. 21 см болса else тармағы іске қосылар еді.' },
  { id: 'failure', title: '3. Жарамсыз көрсеткіш', distance: 40, threshold: 20, invalid: true,
    prompt: 'Шек — 20 см. NaN режимін қос: датчик сандық қашықтық бермеді. Қандай пәрмен мен түсіндірме дұрыс?', action: 'stop',
    explanations: ['NaN өте алыс нысананы білдіреді; жүруге рұқсат', 'NaN әрқашан нөл сантиметрге тең', 'Double.isFinite(NaN) — false; қашықтық белгісіз болғандықтан осы мысалда нөлдік қуат таңдалады'], answer: 2,
    explanation: 'NaN — Not a Number (сан емес). !Double.isFinite(NaN) — true, сондықтан || шартының бірінші бөлігі if тармағына жеткізеді. Белгісіз қашықтықты бос жол деп қабылдамаймыз. Бұл — кіріспе мысалдың сақтық шешімі, толық қауіпсіздік жүйесі емес.' },
] as const
export type SensorChallengeId = (typeof sensorChallenges)[number]['id']
export function evaluateSensorChallenge(id: string, distanceCm: unknown, thresholdCm: unknown, action: unknown, explanation: unknown) {
  const challenge = sensorChallenges.find(item => item.id === id)
  if (!challenge) return { correct: false, message: 'Тапсырманы таңда.' }
  const readingMatches = challenge.invalid ? typeof distanceCm === 'number' && Number.isNaN(distanceCm) : distanceCm === challenge.distance
  if (!readingMatches || thresholdCm !== challenge.threshold) return { correct: false, message: `Кіріс мәндері сәйкес емес. ${challenge.prompt}` }
  if (action !== challenge.action) return { correct: false, message: `Мотор пәрмені сәйкес емес. ${challenge.explanation}` }
  if (explanation !== challenge.answer) return { correct: false, message: `Пәрмен дұрыс, түсіндірмені қайта қара. ${challenge.explanation}` }
  return { correct: true, message: `Дұрыс! ${challenge.explanation}` }
}
export const sensorCodeTasks = [
  { id: 'type', prompt: 'Қашықтық датчигіне Java сілтемесін жарияла.', before: 'private ', after: ' sensor;', options: ['DcMotor', 'DistanceSensor', 'DistanceUnit'], answer: 'DistanceSensor', explanation: 'DistanceSensor — өлшем алатын құрылғының SDK типі. DcMotor — атқарушы құрылғы, ал DistanceUnit — өлшем бірліктері.' },
  { id: 'map', prompt: 'Конфигурациядағы distance атты датчикті ал.', before: 'sensor = hardwareMap.get(', after: ', "distance");', options: ['DistanceSensor.class', 'DcMotor.class', '"I2C 1"'], answer: 'DistanceSensor.class', explanation: 'hardwareMap.get(DistanceSensor.class, "distance") конфигурациядағы дәл атау мен SDK типін қолданады. Java айнымалысының sensor атауы конфигурациядағы distance атауымен бірдей болуы міндетті емес.' },
  { id: 'read', prompt: 'Қашықтықты сантиметрмен double айнымалысына оқы.', before: 'double distanceCm = sensor.getDistance(', after: ');', options: ['DistanceUnit.MM', 'DistanceUnit.METER', 'DistanceUnit.CM'], answer: 'DistanceUnit.CM', explanation: 'CM сантиметрді сұрайды. Мысалы, 20 см = 200 мм; әртүрлі бірліктегі көрсеткіш пен шекті тікелей салыстыруға болмайды.' },
  { id: 'condition', prompt: 'NaN/Infinity немесе шектен аспайтын көрсеткіш үшін if тармағын таңда.', before: 'if (', after: ') {\n    motor.setPower(0);\n} else {\n    motor.setPower(0.3);\n}', options: ['distanceCm < stopDistanceCm', '!Double.isFinite(distanceCm) && distanceCm <= stopDistanceCm', '!Double.isFinite(distanceCm) || distanceCm <= stopDistanceCm'], answer: '!Double.isFinite(distanceCm) || distanceCm <= stopDistanceCm', explanation: '|| — немесе: сан жарамсыз болса НЕМЕСЕ қашықтық шектен аспаса, тоқтату пәрмені таңдалады. && екеуін бірдей талап етеді; NaN-мен <= салыстыруы false болғандықтан ол жарамсыз көрсеткішті өткізіп жібереді.' },
  { id: 'stop', prompt: 'Кедергі не жарамсыз көрсеткіш кезінде мотор қуатын нөлде.', before: 'motor.setPower(', after: ');', options: ['0.3', '-1', '0'], answer: '0', explanation: 'setPower(0) жетек қуатын нөлдейді. −1 тоқтату емес, кері бағыттағы толық қуат. Нақты білік инерциямен қозғала алады.' },
] as const
export const sensorQuestions = [
  { id: 'roles', prompt: 'Sensor мен actuator (атқарушы құрылғы) айырмасы қандай?', options: ['Sensor орта туралы дерек береді, actuator физикалық әрекет жасайды', 'Sensor моторды қоректендіреді, actuator дерек оқиды', 'Екеуі де тек Java кодын сақтайды'], answer: 0, explanation: 'Distance Sensor қашықтықты өлшейді; DC Motor мен Servo әрекет жасайды. Өлшемнен кейін қандай пәрмен берілетінін бағдарлама шешеді.' },
  { id: 'unit', prompt: 'getDistance(DistanceUnit.CM) қандай бірлікпен мән береді?', options: ['Миллиметр', 'Сантиметр', 'Мотор қуатының пайызы'], answer: 1, explanation: 'DistanceUnit.CM — сантиметр. Шек те сантиметрмен берілсе, екі шаманы дұрыс салыстыруға болады.' },
  { id: 'branch', prompt: 'Көрсеткіш 35 см, шек 20 см, сан жарамды. Сабақтағы if/else қандай пәрмен береді?', options: ['setPower(0), өйткені 35 < 20', 'Тармақ таңдалмайды', 'else ішінде setPower(0.3)'], answer: 2, explanation: 'Сан ақырлы, ал 35 ≤ 20 — false. Сондықтан else тармағы 0.3 пәрменін береді. Бұл қозғалысқа пәрмен, өлшенген жылдамдық емес.' },
  { id: 'equality', prompt: 'distanceCm = 20, stopDistanceCm = 20. Қай салыстыру теңдікті де тоқтату шартына қосады?', options: ['distanceCm <= stopDistanceCm', 'distanceCm < stopDistanceCm', 'distanceCm > stopDistanceCm'], answer: 0, explanation: '<= «кіші немесе тең» дегенді білдіреді. 20 ≤ 20 — true; тек < қолданылса, теңдік өткізіліп кетеді.' },
  { id: 'invalid', prompt: 'distanceCm = NaN. Осы оқу мысалында дұрыс шешім қандай?', options: ['NaN-ды алыстағы бос жол деп қабылдау', '!Double.isFinite(distanceCm) арқылы анықтап, setPower(0) беру', 'distanceCm == Double.NaN арқылы тексеріп, 0.3 беру'], answer: 1, explanation: 'Double.isFinite(NaN) — false. NaN-ды == арқылы тексермейміз: NaN өзіне де тең емес. Қашықтық белгісіз кезде мысал нөлдік қуат пәрменін таңдайды.' },
] as const
export const sensorScenario = {
  prompt: 'Жағдаят: оқушы if (distanceCm < 20) { motor.setPower(0); } else { motor.setPower(0.3); } жазды. Экранда NaN тұрса да 0.3 беріліп жатыр. Сабақтың талабына сай қалай түзетесің?',
  options: ['NaN < 20 салыстыруы false; if (!Double.isFinite(distanceCm) || distanceCm <= 20) деп өзгерту', 'NaN-ды өте алыс деп алып, қуатты 1-ге көтеру', 'getDistance() орнына motor.getPower() мәнін сантиметрмен салыстыру'], answer: 0,
  explanation: 'NaN < 20 — false, сондықтан қате код else тармағына өтеді. !Double.isFinite(distanceCm) жарамсыз санды анықтайды, || балама шарттарды біріктіреді, ал <= дәл 20 см-ді де қамтиды. Қате түзетілген соң NaN кезінде setPower(0) беріледі; бұл нақты роботтың лезде тоқтауына кепілдік емес.',
} as const
export const sensorJavaExample = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.DistanceSensor;
import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;

@TeleOp(name = "DistanceMotor", group = "Academy")
public class DistanceMotor extends LinearOpMode {
    private DcMotor motor;
    private DistanceSensor sensor;

    @Override
    public void runOpMode() throws InterruptedException {
        motor = hardwareMap.get(DcMotor.class, "motor");
        motor.setPower(0);
        try {
            motor.setDirection(DcMotorSimple.Direction.FORWARD);
            motor.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
            motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
            sensor = hardwareMap.get(DistanceSensor.class, "distance");
            double stopDistanceCm = 20.0;
            telemetry.addData("Status", "Ready - motor power is zero");
            telemetry.update();

            waitForStart();
            while (opModeIsActive()) {
                double distanceCm = sensor.getDistance(DistanceUnit.CM);
                if (!Double.isFinite(distanceCm) || distanceCm <= stopDistanceCm) {
                    motor.setPower(0);
                } else {
                    motor.setPower(0.3);
                }
                telemetry.addData("Distance cm", distanceCm);
                telemetry.addData("Finite reading", Double.isFinite(distanceCm));
                telemetry.addData("Threshold cm", stopDistanceCm);
                telemetry.addData("Commanded power", motor.getPower());
                telemetry.update();
                idle();
            }
        } finally {
            motor.setPower(0);
        }
    }
}`
export type SensorProgress = {
  assessmentVersion: 1
  previouslyCompleted: false
  read: SensorReadingId[]
  solved: SensorChallengeId[]
  code: Record<string, string>
  answers: Record<string, number>
  scenarioAnswer?: number
  completed: boolean
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export function sensorCodeScore(progress: SensorProgress) {
  return sensorCodeTasks.filter(task => progress.code[task.id] === task.answer).length
}
export function sensorQuizScore(progress: SensorProgress) {
  return sensorQuestions.filter(question => progress.answers[question.id] === question.answer).length
}
export function sensorQuizPassed(progress: SensorProgress) {
  return sensorQuestions.every(question => progress.answers[question.id] !== undefined) && sensorQuizScore(progress) >= 4
}
export function canCompleteSensor(progress: SensorProgress) {
  return sensorReadings.every(section => progress.read.includes(section.id)) &&
    sensorChallenges.every(challenge => progress.solved.includes(challenge.id)) &&
    sensorCodeScore(progress) === sensorCodeTasks.length && sensorQuizPassed(progress) && progress.scenarioAnswer === sensorScenario.answer
}
export function sensorProgressPercent(progress: SensorProgress) {
  const steps = progress.read.length + progress.solved.length + Number(sensorCodeScore(progress) === sensorCodeTasks.length) +
    Number(sensorQuizPassed(progress)) + Number(progress.scenarioAnswer === sensorScenario.answer) + Number(progress.completed && canCompleteSensor(progress))
  return Math.round(steps / 11 * 100)
}
export function normalizeSensorProgress(value: unknown): SensorProgress {
  const progress: SensorProgress = { assessmentVersion: 1, previouslyCompleted: false, read: [], solved: [], code: {}, answers: {}, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) { const read = value.read; progress.read = sensorReadings.filter(item => read.includes(item.id)).map(item => item.id) }
  if (Array.isArray(value.solved)) { const solved = value.solved; progress.solved = sensorChallenges.filter(item => solved.includes(item.id)).map(item => item.id) }
  if (isRecord(value.code)) {
    for (const task of sensorCodeTasks) {
      const answer = value.code[task.id]
      if (typeof answer === 'string' && task.options.some(option => option === answer)) progress.code[task.id] = answer
    }
  }
  if (isRecord(value.answers)) {
    for (const question of sensorQuestions) {
      const answer = value.answers[question.id]
      if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) progress.answers[question.id] = answer
    }
  }
  const scenario = value.scenarioAnswer
  if (typeof scenario === 'number' && Number.isInteger(scenario) && scenario >= 0 && scenario < sensorScenario.options.length) progress.scenarioAnswer = scenario
  progress.completed = value.completed === true && canCompleteSensor(progress)
  return progress
}
export function loadSensorProgress(): SensorProgress {
  try { return normalizeSensorProgress(JSON.parse(localStorage.getItem(sensorStorageKey) ?? 'null')) }
  catch { return normalizeSensorProgress(null) }
}
export function saveSensorProgress(progress: SensorProgress): boolean {
  try { localStorage.setItem(sensorStorageKey, JSON.stringify(normalizeSensorProgress(progress))); return true }
  catch { return false }
}
