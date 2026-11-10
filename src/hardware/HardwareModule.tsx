import { useEffect, useRef, useState } from 'react'
import { Explorer } from './Explorer'
import { Quiz, Troubleshooting } from './Practice'
import { TeacherMode } from './TeacherMode'
import { WiringLab } from './WiringLab'
import { loadProgress, saveProgress } from './model'
import './hardware.css'

const sections = [
  { id: 'explorer', label: 'Hardware Explorer' },
  { id: 'wiring', label: 'Wiring Lab' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'troubleshooting', label: 'Troubleshooting Lab' },
  { id: 'teacher', label: 'Teacher Mode' },
] as const

type HardwareSection = (typeof sections)[number]['id']

export function hardwareSectionFor(hash: string): HardwareSection | undefined {
  return sections.find(section => hash === 'hardware/' + section.id)?.id
}

export function HardwareModule({ section }: { section: HardwareSection }) {
  const [progress, setProgress] = useState(loadProgress)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setStorageAvailable(saveProgress(progress))
  }, [progress])

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    document.getElementById('hardware-module')?.scrollIntoView({ block: 'start' })
  }, [section])

  return (
    <div className="hardware-module" id="hardware-module">
      <header className="topline">
        <span><a href="#home">АКАДЕМИЯ</a> <span className="breadcrumb-divider">/</span> <strong lang="en">FTC HARDWARE</strong></span>
        <span className="language">ҚАЗ</span>
      </header>
      <div className="hw-banner">
        <a className="hw-back" href="#hardware">← Оқу бағыттарына қайту</a>
        <p className="hw-kicker">FTC ACADEMY KZ / 01</p>
        <h1 ref={heading} tabIndex={-1} lang="en">FTC Hardware</h1>
        <p>FTC роботының құрылғыларын таны, қосылымдарды оқу сұлбасында сына және ақаудың ықтимал себептерін талда.</p>
      </div>
      <nav className="hw-tabs" aria-label="FTC Hardware бөлімдері">
        {sections.map(item => (
          <a key={item.id} href={'#hardware/' + item.id} lang="en"
            aria-current={item.id === section ? 'page' : undefined}>{item.label}</a>
        ))}
      </nav>
      {!storageAvailable && <p className="hw-note">Браузерде сақтау қолжетімсіз. Бетті жапсаң, осы әрекеттер сақталмайды.</p>}
      {section === 'explorer' && <Explorer explored={progress.explored} onExplore={id => {
        setProgress(previous => previous.explored.includes(id) ? previous : {
          ...previous, explored: [...previous.explored, id],
        })
      }} />}
      {section === 'wiring' && <WiringLab wiring={progress.wiring} onChange={wiring => {
        setProgress(previous => ({ ...previous, wiring }))
      }} />}
      {section === 'quiz' && <Quiz answers={progress.quiz} onAnswer={(id, answer) => {
        setProgress(previous => previous.quiz[id] !== undefined ? previous : {
          ...previous, quiz: { ...previous.quiz, [id]: answer },
        })
      }} onRetry={() => setProgress(previous => ({ ...previous, quiz: {} }))} />}
      {section === 'troubleshooting' && <Troubleshooting diagnoses={progress.diagnoses} onChange={diagnoses => {
        setProgress(previous => ({ ...previous, diagnoses }))
      }} />}
      {section === 'teacher' && <TeacherMode />}
    </div>
  )
}
