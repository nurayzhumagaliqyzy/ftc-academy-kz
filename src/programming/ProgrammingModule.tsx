import { useEffect, useRef } from 'react'
import { ProgrammingLesson } from './ProgrammingLesson'
import { MotorLesson } from './MotorLesson'
import { GamepadLesson } from './GamepadLesson'
import { AutonomousLesson } from './AutonomousLesson'
import { loadAutonomousProgress, autonomousProgressPercent } from './autonomousModel'
import { loadGamepadProgress, gamepadProgressPercent } from './gamepadModel'
import { loadProgress, progressPercent } from './model'
import { loadMotorProgress, motorProgressPercent } from './motorModel'
import { programmingLessons } from './routes'
import type { ProgrammingSection } from './routes'
import './programming.css'

function ProgrammingOverview() {
  const heading = useRef<HTMLHeadingElement>(null)
  const first = loadProgress()
  const second = loadMotorProgress()
  const third = loadGamepadProgress()
  const fourth = loadAutonomousProgress()
  const progress = [first, second, third, fourth]
  const percentages = [progressPercent(first), motorProgressPercent(second), gamepadProgressPercent(third), autonomousProgressPercent(fourth)]
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('programming-overview')?.scrollIntoView({ block: 'start' })
  }, [])
  return <div className="hardware-module programming-lesson" id="programming-overview">
    <header className="topline"><span><a href="#home">АКАДЕМИЯ</a> / <strong>FTC PROGRAMMING</strong></span><span className="language">ҚАЗ</span></header>
    <div className="hw-banner">
      <a className="hw-back" href="#programming">← Оқу бағыттарына қайту</a>
      <p className="hw-kicker">БАҒДАРЛАМАЛАУ / ТӨРТ САБАҚ</p>
      <h1 ref={heading} tabIndex={-1}>FTC Programming</h1>
      <p>Алдымен бағдарлама құрылымын түсін, содан кейін DC Motor (тұрақты ток қозғалтқышы) мен Gamepad (ойын контроллері) арқылы басқаруды үйрен. Одан кейін Autonomous (автономды режим) алгоритмін жоспарла. Аяқталған сабақтарға кез келген уақытта орала аласың.</p>
    </div>
    <div className="pl-lesson-grid">
      {programmingLessons.map((lesson, index) => <article className="hw-panel" key={lesson.id}>
        <p className="hw-kicker">0{index + 1} / БАСТАПҚЫ ДЕҢГЕЙ</p>
        <h2>{index + 1}-сабақ: {lesson.title}</h2>
        <p>{index === 0 ? 'FTC SDK (бағдарламалық әзірлеу жинағы), OpMode (роботты басқару бағдарламасы) және алғашқы Java мысалы.' : index === 1 ? 'Қосылым, қуат пен бағыт. Мотордың оқу анимациясы, Java тапсырмасы және тест.' : index === 2 ? 'Gamepad, TeleOp (оператор басқаратын режим) және Joystick (басқару тетігі). Кіріс мәнінен мотор қуатына дейінгі оқу моделі.' : 'Алдын ала жоспарланған алгоритм, үш торлы тапсырма және бір моторлы уақытпен басқару мысалы.'}</p>
        <p className="hw-count">{progress[index].completed ? '✓ Аяқталды' : percentages[index] > 0 ? 'Оқу барысында' : 'Әлі басталмады'} · {percentages[index]}%</p>
        {progress[index].previouslyCompleted && !progress[index].completed && <p className="hw-muted">Бұрынғы аяқтау белгісі сақталған · жаңартылған бағалау күтіледі</p>}
        <a className="primary-link" href={'#' + lesson.hash}>{progress[index].completed ? 'Сабақты қайта қарау' : 'Сабақты ашу'} →</a>
      </article>)}
    </div>
    <p className="hw-note">Оқу жаттығулары браузерде орындалады. Нақты роботқа қосылу немесе Java кодын құрастыру қарастырылмаған.</p>
  </div>
}

export function ProgrammingModule({ section }: { section: ProgrammingSection }) {
  if (section === 'sdk-opmode') return <ProgrammingLesson />
  if (section === 'dc-motor') return <MotorLesson />
  if (section === 'gamepad-teleop') return <GamepadLesson />
  if (section === 'autonomous') return <AutonomousLesson />
  return <ProgrammingOverview />
}
