export const integratedStorageKey = 'ftc-academy-kz:programming:integrated:v1'
export const maxMissionCommands = 32
export const illustrativeTicksPerCell = 100
export type Point = { x: number; y: number }
export type Direction = 'N' | 'E' | 'S' | 'W'
export const commandLabels = {
  forward: 'Move Forward · бір ұяшық алға', left: 'Turn Left 90° · солға', right: 'Turn Right 90° · оңға',
  open: 'Open Claw · ашу', close: 'Close Claw · жабу', read: 'Read Distance · кедергіні тексеру',
  ifObstacle: 'IF-OBSTACLE · бөгет болса солға, әйтпесе алға', stop: 'Stop · орындауды аяқтау',
} as const
export type MissionCommand = keyof typeof commandLabels
export type MissionId = 'pickup' | 'avoid' | 'delivery'
export type Mission = { id: MissionId; title: string; start: Point; direction: Direction; object: Point; zone: Point; walls: readonly Point[]; goal: string; hint: string; reference: readonly MissionCommand[] }
export const missions: readonly Mission[] = [
  { id: 'pickup', title: '1. Затты жина', start: { x: 0, y: 4 }, direction: 'E', object: { x: 2, y: 4 }, zone: { x: 4, y: 0 }, walls: [{ x: 2, y: 2 }],
    goal: 'Claw бастапқыда жабық. Оны ашып, (2,4) зат ұяшығына кел, жап және Stop орында. Затты ұстап қал; жеткізу әзірге міндет емес.',
    hint: 'Алдымен Open Claw. Шығысқа екі Move Forward, содан кейін Close Claw және Stop.', reference: ['open','forward','forward','close','stop'] },
  { id: 'avoid', title: '2. Кедергіні айналып өт', start: { x: 0, y: 2 }, direction: 'E', object: { x: 4, y: 4 }, zone: { x: 2, y: 2 }, walls: [{ x: 1, y: 2 }],
    goal: 'Алдағы бөгетті бақылап, IF-OBSTACLE арқылы шартты шешім қолдан. (1,2) ұяшығын айналып, (2,2) аймағына жетіп Stop орында. Затты жинау бұл миссияда міндет емес.',
    hint: 'Read Distance → IF-OBSTACLE солға бұрады. Бір ұяшық солтүстікке, екі ұяшық шығысқа, бір ұяшық оңтүстікке жүр.', reference: ['read','ifObstacle','forward','right','forward','forward','right','forward','stop'] },
  { id: 'delivery', title: '3. Толық жеткізу', start: { x: 0, y: 4 }, direction: 'E', object: { x: 2, y: 4 }, zone: { x: 4, y: 2 }, walls: [{ x: 3, y: 4 }, { x: 3, y: 3 }],
    goal: 'Затты (2,4) ұяшығында жина. Алдағы бөгетті байқап, IF-OBSTACLE қолдан. Затты (4,2) аймағына апарып, Open Claw арқылы босат және Stop орында.',
    hint: 'Затты алған соң алда қабырға бар. IF солтүстікке бұрады. Екі ұяшық солтүстікке, оңға бұрылып екі ұяшық шығысқа; Open Claw → Stop.', reference: ['open','forward','forward','close','read','ifObstacle','forward','forward','right','forward','forward','open','stop'] },
]
const vectors: Record<Direction, Point> = { N: { x: 0, y: -1 }, E: { x: 1, y: 0 }, S: { x: 0, y: 1 }, W: { x: -1, y: 0 } }
export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y
export function isWall(point: Point, mission: Mission) { return point.x < 0 || point.y < 0 || point.x >= 5 || point.y >= 5 || mission.walls.some(wall => samePoint(wall, point)) }
export type Observation = { cells: number; blocked: boolean; position: Point; direction: Direction }
export type MissionState = {
  position: Point; direction: Direction; claw: 'open' | 'closed'; object: { status: 'ground' | 'carried' | 'delivered'; position: Point };
  pickedUp: boolean; sawObstacle: boolean; conditionalUsed: boolean; moves: number; ticks: number; path: Point[];
  observation?: Observation; nextIndex: number; lastIndex?: number; status: 'ready' | 'running' | 'paused' | 'success' | 'failed'; message: string;
}
export function initialMission(mission: Mission): MissionState {
  return { position: { ...mission.start }, direction: mission.direction, claw: 'closed', object: { status: 'ground', position: { ...mission.object } }, pickedUp: false, sawObstacle: false, conditionalUsed: false, moves: 0, ticks: 0, path: [{ ...mission.start }], nextIndex: 0, status: 'ready', message: 'Жоспар құр. Бастапқы Claw жабық; координаталар (x,y), 0…4. Солтүстік — жоғары.' }
}
export function observeDistance(state: MissionState, mission: Mission): Observation {
  const v = vectors[state.direction]; let cells = 0; let p = { x: state.position.x + v.x, y: state.position.y + v.y }
  while (!isWall(p, mission)) { cells++; p = { x: p.x + v.x, y: p.y + v.y } }
  return { cells, blocked: cells === 0, position: { ...state.position }, direction: state.direction }
}
export function missionObjective(state: MissionState, mission: Mission) {
  if (mission.id === 'pickup') return state.pickedUp && state.object.status === 'carried' && state.claw === 'closed'
  if (mission.id === 'avoid') return samePoint(state.position, mission.zone) && state.sawObstacle && state.conditionalUsed && state.moves > 0
  return samePoint(state.position, mission.zone) && state.pickedUp && state.object.status === 'delivered' && samePoint(state.object.position, mission.zone) && state.claw === 'open' && state.sawObstacle && state.conditionalUsed
}
export function isMissionCommand(value: unknown): value is MissionCommand { return typeof value === 'string' && Object.hasOwn(commandLabels, value) }
export function validateProgram(commands: readonly unknown[]) {
  if (!commands.length) return 'Кемінде бір пәрмен қос.'
  if (commands.length > maxMissionCommands) return `Ең көбі ${maxMissionCommands} пәрмен.`
  if (!commands.every(isMissionCommand)) return 'Белгісіз пәрмен. Тізімдегі дайын пәрмендерді қолдан.'
  return undefined
}
export function startMission(state: MissionState, commands: readonly unknown[]): MissionState {
  if (state.status !== 'ready' && state.status !== 'paused') return state
  const error = validateProgram(commands)
  return error ? { ...state, status: 'failed', message: error } : { ...state, status: 'running', message: 'Пәрмендер ретімен орындалады. Pause — уақытша үзіліс, Stop — алгоритмнің соңы.' }
}
export function pauseMission(state: MissionState): MissionState { return state.status === 'running' ? { ...state, status: 'paused', message: 'Үзіліс. Жалғастыруға не бір қадам орындауға болады.' } : state }
export function advanceMission(state: MissionState, commands: readonly unknown[], mission: Mission): MissionState {
  if (state.status !== 'running') return state
  const error = validateProgram(commands)
  if (error) return { ...state, status: 'failed', message: error }
  if (state.nextIndex >= commands.length) return { ...state, status: 'failed', message: 'Тізім бітті, бірақ Stop орындалған жоқ. Миссия расталмады; соңына Stop қосып қайта сына.' }
  const command = commands[state.nextIndex] as MissionCommand
  let next: MissionState = { ...state, nextIndex: state.nextIndex + 1, lastIndex: state.nextIndex }
  const turn = (direction: Direction, delta: number): Direction => (['N','E','S','W'] as const)[(['N','E','S','W'].indexOf(direction) + delta + 4) % 4]
  let action = command
  if (command === 'read' || command === 'ifObstacle') {
    const observation = observeDistance(state, mission)
    next = { ...next, observation, sawObstacle: state.sawObstacle || observation.blocked,
      conditionalUsed: state.conditionalUsed || (command === 'ifObstacle' && observation.blocked),
      message: `Бақылау (${state.position.x},${state.position.y}) ${state.direction}: ${observation.cells} бос ұяшық. ${observation.blocked ? 'Алдағы ұяшық жабық.' : 'Алдағы ұяшық бос.'}` }
    if (command === 'ifObstacle') { action = observation.blocked ? 'left' : 'forward'; next.message += observation.blocked ? ' IF: солға бұрыл.' : ' ELSE: бір ұяшық алға.' }
  }
  if (action === 'forward') {
    const v = vectors[next.direction]; const destination = { x: next.position.x + v.x, y: next.position.y + v.y }
    if (isWall(destination, mission)) return { ...next, status: 'failed', message: `Қозғалыс орындалмады: (${destination.x},${destination.y}) — қабырға не алаң шеті. Мотор пәрмені нөлге келтірілді. Read/IF пен бағытты тексеріп, reset арқылы қайта баста.` }
    next = { ...next, position: destination, moves: next.moves + 1, ticks: next.ticks + illustrativeTicksPerCell, path: [...next.path, destination], message: command === 'ifObstacle' ? next.message : 'Бір ұяшық алға. Оқу санағышына +100 шартты tick қосылды; бұл нақты Encoder өлшемі емес.' }
    if (next.object.status === 'carried') next.object = { ...next.object, position: { ...destination } }
  } else if (action === 'left' || action === 'right') {
    next = { ...next, direction: turn(next.direction, action === 'left' ? -1 : 1), message: command === 'ifObstacle' ? next.message : '90° бұрылыс: бағыт өзгерді, ұяшық пен қозғалыс санағышы өзгерген жоқ.' }
  } else if (action === 'open') {
    next = { ...next, claw: 'open', message: 'Claw ашық. Затты жинау үшін оның ұяшығында ашық күйден Close Claw орында.' }
    if (state.object.status === 'carried') {
      const delivered = samePoint(state.position, mission.zone)
      next.object = { status: delivered ? 'delivered' : 'ground', position: { ...state.position } }
      next.message = delivered ? 'Зат жеткізу аймағында босатылды. Енді Stop арқылы нәтижені тексер.' : 'Зат аймақтан тыс түсірілді. Сол ұяшықта Claw-ды жауып қайта жинауға болады.'
    }
  } else if (action === 'close') {
    next = { ...next, claw: 'closed', message: state.object.status === 'carried'
      ? 'Claw затты ұстап тұр. Босату үшін Open Claw таңда.'
      : 'Claw жабылды, бірақ зат алынған жоқ. Зат ұяшығы, open → close реті және зат күйін тексер.' }
    if (state.claw === 'open' && state.object.status === 'ground' && samePoint(state.position, state.object.position)) {
      next.object = { status: 'carried', position: { ...state.position } }; next.pickedUp = true; next.message = 'Зат жиналды! Claw жабық, зат роботпен бірге қозғалады.'
    }
  } else if (action === 'stop') {
    const correct = missionObjective(next, mission)
    next = { ...next, status: correct ? 'success' : 'failed', message: correct ? '✓ Миссия орындалды: мақсаттың барлық күйі және Stop расталды. Нәтиже сақталады.' : `Stop орындалды, бірақ мақсат толық емес. ${mission.goal} Координатаға жету затты жинау/босату дәлелі емес.` }
  }
  if (next.status === 'running' && next.nextIndex === commands.length) next = { ...next, status: 'failed', message: `${next.message} Тізім бітті: Stop жоқ, миссия қабылданбайды.` }
  return next
}
export function stepMission(state: MissionState, commands: readonly unknown[], mission: Mission) {
  const next = advanceMission(startMission(state, commands), commands, mission)
  return next.status === 'running' ? { ...next, status: 'paused' as const } : next
}
export function editProgram(commands: readonly MissionCommand[], operation: { type: 'add'; command: unknown } | { type: 'delete'; index: number } | { type: 'move'; index: number; delta: -1 | 1 }, active = false): MissionCommand[] {
  if (active) return [...commands]
  const result = [...commands]
  if (operation.type === 'add') { if (result.length < maxMissionCommands && isMissionCommand(operation.command)) result.push(operation.command) }
  else if (Number.isInteger(operation.index) && operation.index >= 0 && operation.index < result.length) {
    if (operation.type === 'delete') result.splice(operation.index, 1)
    else { const other = operation.index + operation.delta; if (other >= 0 && other < result.length) [result[operation.index], result[other]] = [result[other], result[operation.index]] }
  }
  return result
}
export const integratedReadings = [{ id: 'architecture', title: 'Бір роботтағы кіріс, шешім және әрекет' },{ id: 'planning', title: 'Миссияны жоспарлау: мақсаттан алгоритмге' },{ id: 'debugging', title: 'Сынау, қатені табу және қалпына келтіру' },{ id: 'hardware', title: 'Оқу моделінен нақты FTC роботыңа' }] as const
export const integratedCodeTasks = [
  { id: 'map', prompt: 'Конфигурацияда claw деп аталған стандартты Servo-ны ал.', before: 'Servo claw = ', after: '(Servo.class, "claw");', options: ['hardwareMap.get','telemetry.update','claw.setPosition'], answer: 'hardwareMap.get', explanation: 'hardwareMap.get() конфигурациядағы дәл атау мен Java типін байланыстырады. Физикалық Servo орнатылуы бөлек тексеріледі.' },
  { id: 'distance', prompt: 'Distance Sensor көрсеткішін сантиметрмен оқы.', before: 'double cm = sensor.', after: ';', options: ['getCurrentPosition()','getDistance(DistanceUnit.CM)','setPower(0)'], answer: 'getDistance(DistanceUnit.CM)', explanation: 'Өлшем бірлігі CM арқылы беріледі. Нақты өлшемге Double.isFinite(cm) тексеруі қажет; grid ұяшықтары сантиметр емес.' },
  { id: 'target', prompt: 'RUN_TO_POSITION режимінен бұрын Encoder нысанасын орнат.', before: 'motor.', after: '(targetTicks);', options: ['setPower','getTargetPosition','setTargetPosition'], answer: 'setTargetPosition', explanation: 'Target алдымен беріледі, содан кейін режим және теріс емес қуат шамасы таңдалады. Target орындалғанын өздігінен растамайды.' },
  { id: 'servo', prompt: 'Стандартты Servo-ға өз механизміңде тексерілген openPosition мәнін бер.', before: 'claw.', after: '(openPosition);', options: ['setPosition','setTargetPosition','setPower'], answer: 'setPosition', explanation: 'Servo.setPosition() 0…1 аралығындағы нысаналы позицияны береді. Әмбебап ашу бұрышы жоқ; CRServo бұл тапсырмадағы құрылғы емес.' },
  { id: 'active', prompt: 'START-тан кейін циклді STOP жағдайымен шекте.', before: 'while (', after: ' && timer.seconds() < timeoutSeconds) { /* bounded task */ }', options: ['true','opModeIsActive()','motor.getPower()'], answer: 'opModeIsActive()', explanation: 'opModeIsActive() STOP кезінде циклден шығуға көмектеседі. Timeout және finally ішіндегі setPower(0) әлі де қажет.' },
] as const
export const integratedQuestions = [
  { id: 'architecture', prompt: 'Distance Sensor → if/else → motor.setPower() тізбегі нені көрсетеді?', options: ['Кіріс → өңдеу → шығыс','Тек Servo позициясын','Абсолют робот координатасын'], answer: 0, explanation: 'Sensor — кіріс, шарт — шешім, мотор пәрмені — шығыс. Encoder келесі бақылауға кері байланыс береді.' },
  { id: 'invalid', prompt: 'Нақты Distance Sensor NaN қайтарды. Бастапқы қауіпсіз мысалда не істеу керек?', options: ['Алға жүруді жалғастыру','Өлшемді жарамсыз деп танып, моторға нөлдік қуат беру','NaN-ды нөл емес болғандықтан қауіпсіз деу'], answer: 1, explanation: 'Double.isFinite() false болса, жоспарды тоқтатып ақауды тексер. setPower(0) нақты қозғалысты бір сәтте тоқтатуға кепіл емес.' },
  { id: 'encoder', prompt: 'Grid-тағы бір қадам және +100 оқу tick-і туралы дұрыс тұжырым қайсы?', options: ['Кез келген моторда дәл 10 см','Барлық моторда бір айналым','Бұл модельдің келісімі; нақты моторда калибрлеу керек'], answer: 2, explanation: 'Нақты Encoder саны, беріліс, дөңгелек өлшемі мен сырғанау бөлек. Оқу санағышы физикалық сенсордан оқылмайды.' },
  { id: 'claw', prompt: 'Робот жеткізу аймағына келді, бірақ зат әлі Claw ішінде. Не жетіспейді?', options: ['Дұрыс босату және Stop','Тек басқа координата атауы','Теріс Servo RPM'], answer: 0, explanation: 'Толық мақсатта зат жиналып, аймаққа тасылып, Open Claw арқылы босатылып, Stop орындалуы керек.' },
  { id: 'mode', prompt: 'RUN_TO_POSITION үшін дұрыс рет қайсы?', options: ['Теріс қуат → reset → target','Target → RUN_TO_POSITION → теріс емес қуат, кейін STOP/timeout бақылауы','Тек setTargetPosition(), бақылаусыз күту'], answer: 1, explanation: 'Target режимнен бұрын беріледі. Белсенділік пен timeout тексеріліп, соңында қауіпсіз тазалау орындалады. Бір мотор мысалы толық drivetrain емес.' },
] as const
export const integratedScenario = { prompt: 'Робот target zone-ға жетіп Stop орындады. Бағдарлама тек координатаны тексеріп «сәтті» деді, бірақ зат бастапқы ұяшықта қалды. Кейінгі сынақта зат Claw ішінде босатылмай қалды. Бағалауды қалай түзетесің?', options: ['Тек жеткізу аймағының координатасын өзгертемін','Затты алғанын, аймаққа алып келгенін, сол жерде босатқанын және Stop орындалғанын бірге тексеремін','Claw күйін тексермей, Encoder санын көбейтемін'], answer: 1, explanation: 'Мақсат — заттың күйі де бар postcondition. pickedUp, delivered, object.position, claw=open және Stop бірге керек. Координата жалғыз өзі тапсырманы растамайды.' } as const
export type IntegratedProgress = { assessmentVersion: 1; previouslyCompleted: false; read: string[]; solved: MissionId[]; code: Record<string,string>; answers: Record<string,number>; scenarioAnswer?: number; completed: boolean }
const record = (v: unknown): v is Record<string,unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
export const integratedCodeScore = (p: IntegratedProgress) => integratedCodeTasks.filter(t => p.code[t.id] === t.answer).length
export const integratedQuizScore = (p: IntegratedProgress) => integratedQuestions.filter(q => p.answers[q.id] === q.answer).length
export const integratedQuizPassed = (p: IntegratedProgress) => integratedQuestions.every(q => p.answers[q.id] !== undefined) && integratedQuizScore(p) >= 4
export const canCompleteIntegrated = (p: IntegratedProgress) => integratedReadings.every(r => p.read.includes(r.id)) && missions.every(m => p.solved.includes(m.id)) && integratedCodeScore(p) === 5 && integratedQuizPassed(p) && p.scenarioAnswer === integratedScenario.answer
export function integratedProgressPercent(p: IntegratedProgress) { return Math.min(100, Math.round((integratedReadings.filter(r=>p.read.includes(r.id)).length + missions.filter(m=>p.solved.includes(m.id)).length + Number(integratedCodeScore(p) === 5) + Number(integratedQuizPassed(p)) + Number(p.scenarioAnswer === integratedScenario.answer) + Number(p.completed && canCompleteIntegrated(p))) / 11 * 100)) }
export function normalizeIntegratedProgress(value: unknown): IntegratedProgress {
  const p: IntegratedProgress = { assessmentVersion: 1, previouslyCompleted: false, read: [], solved: [], code: {}, answers: {}, completed: false }
  if (!record(value)) return p
  if (Array.isArray(value.read)) { const read = value.read; p.read = integratedReadings.filter(r=>read.includes(r.id)).map(r=>r.id) }
  if (Array.isArray(value.solved)) { const solved = value.solved; p.solved = missions.filter(m=>solved.includes(m.id)).map(m=>m.id) }
  if (record(value.code)) for (const t of integratedCodeTasks) { const a=value.code[t.id]; if(typeof a==='string' && t.options.some(o=>o===a)) p.code[t.id]=a }
  if (record(value.answers)) for (const q of integratedQuestions) { const a=value.answers[q.id]; if(typeof a==='number' && Number.isInteger(a) && a>=0 && a<q.options.length) p.answers[q.id]=a }
  const s=value.scenarioAnswer; if(typeof s==='number' && Number.isInteger(s) && s>=0 && s<integratedScenario.options.length) p.scenarioAnswer=s
  p.completed=value.completed===true && canCompleteIntegrated(p); return p
}
export function loadIntegratedProgress() { try { return normalizeIntegratedProgress(JSON.parse(localStorage.getItem(integratedStorageKey)??'null')) } catch { return normalizeIntegratedProgress(null) } }
export function saveIntegratedProgress(p: IntegratedProgress) { try { localStorage.setItem(integratedStorageKey,JSON.stringify(normalizeIntegratedProgress(p))); return true } catch { return false } }
