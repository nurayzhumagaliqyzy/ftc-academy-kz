export const storageKey = 'ftc-academy-kz:programming:sdk-opmode:v2'
export const legacyStorageKey = 'ftc-academy-kz:programming:sdk-opmode:v1'

export const readingSections = [
  { id: 'intro', title: 'FTC бағдарламалауына кіріспе' },
  { id: 'sdk', title: 'FTC SDK және OpMode' },
  { id: 'modes', title: 'TeleOp және Autonomous' },
  { id: 'code', title: 'Алғашқы Java мысалы' },
] as const

export type ReadingId = (typeof readingSections)[number]['id']

export const functions = [
  { id: 'display', label: 'Дайын хабарламаларды Driver Station экранына жіберу' },
  { id: 'active', label: 'Бағдарламаның әлі белсенді екенін тексеру' },
  { id: 'tools', label: 'Робот бағдарламасын жасауға дайын құралдар мен кластар беру' },
  { id: 'input', label: 'Бірінші ойын контроллерінің деректерін оқу' },
  { id: 'start', label: 'START пәрменін күту' },
] as const

export const concepts = [
  { id: 'sdk', term: 'FTC SDK', answer: 'tools', explanation: 'FTC SDK роботқа бағдарлама жазуға қажетті кластар мен әдістерді ұсынады.' },
  { id: 'wait', term: 'waitForStart()', answer: 'start', explanation: 'waitForStart() орындалуды START басылғанша күттіріп тұрады; STOP сұрауы күтуді үзе алады.' },
  { id: 'active', term: 'opModeIsActive()', answer: 'active', explanation: 'Бұл әдіс OpMode іске қосылып, тоқтату сұралмаған кезде true қайтарады.' },
  { id: 'gamepad', term: 'gamepad1', answer: 'input', explanation: 'gamepad1 арқылы бірінші Gamepad батырмалары мен Joystick (басқару тетігі) күйін оқимыз.' },
  { id: 'telemetry', term: 'telemetry.update()', answer: 'display', explanation: 'telemetry.addData() хабарлама дайындайды, ал telemetry.update() оны Driver Station экранына жібереді.' },
] as const

export const questions = [
  {
    id: 'sdk', prompt: 'FTC SDK не үшін қажет?',
    options: ['Роботтың батареясын зарядтау үшін', 'Робот бағдарламасына дайын кластар мен әдістерді қолдану үшін', 'Java тілінің синтаксисін қазақшаға аудару үшін'],
    answer: 1, explanation: 'FTC SDK — бағдарламалық әзірлеу жинағы. Оның дайын кластары мен әдістері робот құрылғылары және басқару жүйесімен жұмыс істеуге көмектеседі.',
  },
  {
    id: 'opmode', prompt: 'OpMode дегеніміз не?',
    options: ['Роботтың әрекетін анықтайтын бағдарлама', 'Тек моторға жалғанатын кабель', 'Роботтың батарея түрі'],
    answer: 0, explanation: 'OpMode — роботты басқару бағдарламасы. Оны Driver Station қолданбасында таңдап, іске қосады.',
  },
  {
    id: 'modes', prompt: 'Оператор Gamepad арқылы пәрмен беріп отыр. Бұл қай режим?',
    options: ['Autonomous', 'Режим тек мотор санына байланысты', 'TeleOp'],
    answer: 2, explanation: 'TeleOp кезінде бағдарлама оператордың Gamepad деректерін қолдана алады. Autonomous кезінде робот адам басқаруынсыз, жазылған алгоритм бойынша әрекет етеді.',
  },
  {
    id: 'start', prompt: 'LinearOpMode мысалында waitForStart() не істейді?',
    options: ['Барлық моторды бірден іске қосады', 'START пәрменін күтеді', 'Java кодын құрастырады'],
    answer: 1, explanation: 'waitForStart() START пәрменін күтеді. Одан кейінгі while (opModeIsActive()) циклі OpMode белсенді болғанда ғана орындалады; STOP сұрауы кезінде цикл аяқталады.',
  },
  {
    id: 'telemetry', prompt: 'telemetry.addData("A", gamepad1.a) орындалды. Деректі экранға жіберу үшін не шақырамыз?',
    options: ['telemetry.update()', 'waitForStart()', 'gamepad1.a()'],
    answer: 0, explanation: 'telemetry.update() дайын деректерді Driver Station экранына жібереді. gamepad1.a — батырманың күйін сақтайтын boolean өрісі, әдіс емес. Бұл код моторды қозғалтпайды.',
  },
] as const

export const sdkScenario = {
  prompt: 'Жағдаят: мотор конфигурациядан алынды. Оқушы motor.setPower(0.5); жолын waitForStart(); жолынан бұрын қойды. Негізгі қатені қалай түзетесің?',
  options: ['Алдымен waitForStart(); содан кейін opModeIsActive() шартын тексеріп, қозғалыс пәрменін беру', 'Тек @TeleOp орнына @Autonomous жазу', 'waitForStart() жолын алып тастау'],
  answer: 0,
  explanation: 'Қозғалыс пәрмені START-қа дейін берілген: мотор INIT кезінде қозғалып кетуі мүмкін. Құрылғыларды алдын ала дайындауға болады, бірақ қозғалысты waitForStart() шақыруынан кейін, OpMode белсенді болғанда ғана бастаймыз. Аннотацияны ауыстыру бұл ретті түземейді.',
} as const

export type Progress = {
  assessmentVersion: 2
  previouslyCompleted: boolean
  scenarioAnswer?: number
  read: ReadingId[]
  matches: Record<string, string>
  answers: Record<string, number>
  completed: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function quizScore(progress: Progress) {
  return questions.filter(question => progress.answers[question.id] === question.answer).length
}

export function matchingScore(progress: Progress) {
  return concepts.filter(concept => progress.matches[concept.id] === concept.answer).length
}

export function quizPassed(progress: Progress) {
  return questions.every(question => progress.answers[question.id] !== undefined) && quizScore(progress) >= 4
}

function legacyCompletionRequirements(progress: Progress) {
  return readingSections.every(section => progress.read.includes(section.id)) &&
    matchingScore(progress) === concepts.length && quizPassed(progress)
}

export function canComplete(progress: Progress) {
  return legacyCompletionRequirements(progress) && progress.scenarioAnswer === sdkScenario.answer
}
export function progressPercent(progress: Progress) {
  const steps = progress.read.length + Number(matchingScore(progress) === concepts.length) +
    Number(quizPassed(progress)) + Number(progress.scenarioAnswer === sdkScenario.answer) + Number(progress.completed && canComplete(progress))
  return Math.round(steps / 8 * 100)
}

export function normalizeProgress(value: unknown): Progress {
  const progress: Progress = { assessmentVersion: 2, previouslyCompleted: false, read: [], matches: {}, answers: {}, completed: false }
  if (!isRecord(value)) return progress
  if (Array.isArray(value.read)) {
    const read = value.read
    progress.read = readingSections.filter(section => read.includes(section.id)).map(section => section.id)
  }
  if (isRecord(value.matches)) {
    for (const concept of concepts) {
      const match = value.matches[concept.id]
      if (typeof match === 'string' && functions.some(item => item.id === match)) {
        progress.matches[concept.id] = match
      }
    }
  }
  if (isRecord(value.answers)) {
    for (const question of questions) {
      const answer = value.answers[question.id]
      if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) {
        progress.answers[question.id] = answer
      }
    }
  }
  const scenarioAnswer = value.scenarioAnswer
  if (typeof scenarioAnswer === 'number' && Number.isInteger(scenarioAnswer) && scenarioAnswer >= 0 && scenarioAnswer < sdkScenario.options.length) progress.scenarioAnswer = scenarioAnswer
  progress.previouslyCompleted = value.previouslyCompleted === true ||
    ((value.assessmentVersion === undefined || value.assessmentVersion === 1) && value.completed === true && legacyCompletionRequirements(progress))
  progress.completed = value.completed === true && canComplete(progress)
  return progress
}

// Access to localStorage itself may throw when browser storage is blocked.
// v1 remains an untouched backup; v2 is the current assessment record.
export function loadProgress(): Progress {
  try {
    const current = localStorage.getItem(storageKey)
    if (current !== null) {
      try { const parsed: unknown = JSON.parse(current); if (isRecord(parsed)) return normalizeProgress(parsed) } catch { /* recover from the v1 backup below */ }
    }
    return normalizeProgress(JSON.parse(localStorage.getItem(legacyStorageKey) ?? 'null'))
  } catch { return normalizeProgress(null) }
}
export function saveProgress(progress: Progress): boolean {
  try { localStorage.setItem(storageKey, JSON.stringify(normalizeProgress(progress))); return true }
  catch { return false }
}
