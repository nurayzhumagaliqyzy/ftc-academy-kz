import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import mark from './assets/mark.svg'
import robot from './assets/robot.svg'

const iconPaths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chip: 'M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3M6 6h12v12H6zM10 10h4v4h-4z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18',
  game: 'M7 7h10a4 4 0 0 1 3.9 3.2l1 4.7a2.6 2.6 0 0 1-4.4 2.4l-2-2.3h-7l-2 2.3a2.6 2.6 0 0 1-4.4-2.4l1-4.7A4 4 0 0 1 7 7zm1 2v4m-2-2h4m6-1h.01m2 2h.01',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
} as const

type IconName = keyof typeof iconPaths

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type Course = {
  id: string
  title: string
  label: string
  icon: IconName
  description: string
  topics?: string[]
}

const courses: Course[] = [
  {
    id: 'hardware',
    title: 'FTC Hardware',
    label: 'Робот құрылғылары',
    icon: 'chip',
    description: 'FTC роботының негізгі бөлшектерімен таныс. Chassis, motor және sensor не үшін қолданылатынын түсін.',
    topics: ['Chassis және drivetrain', 'Control Hub жүйесіне motor қосу', 'Sensor түрлері және қызметі'],
  },
  {
    id: 'programming',
    title: 'FTC Programming',
    label: 'Бағдарламалау',
    icon: 'code',
    description: 'FTC SDK ортасымен танысып, Java тілінде TeleOp және Autonomous режимдеріне арналған бағдарлама жазуды үйрен.',
    topics: ['FTC SDK және OpMode', 'Gamepad арқылы басқару (TeleOp)', 'Autonomous режимінде қозғалысты басқару'],
  },
  {
    id: 'simulator',
    title: 'Robot Simulator',
    label: 'Виртуалды практика',
    icon: 'game',
    description: 'Робот қозғалысын виртуалды алаңда сынауға арналған жаттығу ортасы.',
  },
]

function CourseCard({ course, index }: { course: Course; index: number }) {
  return (
    <article className={'course-card ' + course.id} id={course.id} aria-labelledby={course.id + '-title'} tabIndex={-1}>
      <div className="card-visual" aria-hidden="true">
        <span className="card-index">МОДУЛЬ / 0{index + 1}</span>
        <div className="card-orbit"><Icon name={course.icon} size={46} /></div>
        <span className="visual-corner" />
      </div>
      <div className="card-body">
        <p className="card-category">{course.label}</p>
        <h3 id={course.id + '-title'} lang="en">{course.title}</h3>
        <p className="card-description">{course.description}</p>
        {course.topics ? (
          <details>
            <summary>Курс тақырыптары <Icon name="chevron" size={16} /></summary>
            <ul>{course.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
          </details>
        ) : (
          <div className="coming-soon"><Icon name="clock" size={16} /> Жоспарда</div>
        )}
      </div>
    </article>
  )
}

export function App() {
  const [active, setActive] = useState(() => window.location.hash.slice(1) || 'home')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function updateActive() {
      setActive(window.location.hash.slice(1) || 'home')
    }

    window.addEventListener('hashchange', updateActive)
    return () => window.removeEventListener('hashchange', updateActive)
  }, [])

  function closeMenuOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false)
      menuButton.current?.focus()
    }
  }

  return (
    <div className="layout">
      <a className="skip-link" href="#main">Мазмұнға өту</a>
      <aside className="sidebar" onKeyDown={closeMenuOnEscape}>
        <div className="sidebar-top">
          <a className="brand" href="#home" onClick={() => setMenuOpen(false)}>
            <img src={mark} alt="" width="42" height="42" />
            <span className="brand-name" lang="en">FTC Academy <b>KZ</b><small lang="kk">Робототехника мектебі</small></span>
          </a>
          <button
            className="menu-button"
            ref={menuButton}
            type="button"
            aria-label={menuOpen ? 'Мәзірді жабу' : 'Мәзірді ашу'}
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
        <nav id="navigation" className={menuOpen ? 'navigation is-open' : 'navigation'} aria-label="Бүйірлік мәзір">
          <p className="nav-heading">МӘЗІР</p>
          <a href="#home" aria-current={active === 'home' ? 'location' : undefined} onClick={() => setMenuOpen(false)}>
            <Icon name="home" /> Басты бет
          </a>
          <p className="nav-heading nav-course-heading">ОҚУ БАҒЫТТАРЫ</p>
          {courses.map((course) => (
            <a key={course.id} href={'#' + course.id} aria-current={active === course.id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>
              <Icon name={course.icon} /> {course.id === 'simulator' ? 'Робот симуляторы' : course.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer"><span /> Қазақ тіліндегі оқу платформасы</div>
      </aside>

      <main id="main" className="main" tabIndex={-1}>
        <div className="content">
          <header className="topline" id="home" tabIndex={-1}>
            <span>АКАДЕМИЯ <span className="breadcrumb-divider">/</span> <strong>БАСТЫ БЕТ</strong></span>
            <span className="language">ҚАЗ</span>
          </header>

          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><span /> FIRST TECH CHALLENGE</p>
              <h1 id="hero-title">FTC робототехникасын <em>қазақша үйрен</em></h1>
              <p className="hero-description">Роботтың құрылысын түсінуден бастап, оны басқаратын алғашқы бағдарламаңды жазуға дейін.</p>
              <a className="primary-link" href="#courses">Оқу бағыттарын қарау <Icon name="arrow" size={18} /></a>
            </div>
            <div className="hero-art" aria-hidden="true">
              <img src={robot} alt="" width="570" height="420" />
            </div>
          </section>

          <section id="courses" className="courses" aria-labelledby="courses-title" tabIndex={-1}>
            <div className="section-heading">
              <div>
                <p className="section-kicker">КУРСТАР</p>
                <h2 id="courses-title">Оқу бағыттары</h2>
                <p>Өзіңе қызық бағыттан баста.</p>
              </div>
              <span className="module-count">03 БАҒЫТ</span>
            </div>
            <div className="course-grid">
              {courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
            </div>
          </section>

          <footer className="main-footer"><span lang="en">FTC Academy KZ</span><span>Робототехника негіздері</span></footer>
        </div>
      </main>
    </div>
  )
}
