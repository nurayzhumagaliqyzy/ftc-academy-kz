import { useState } from 'react'
import { SourceLinks } from './Explorer'
import { connectionError, getPort, leadIds, leads, portGroups } from './model'
import type { Connections, LeadId } from './model'

type Feedback = { kind: 'good' | 'bad' | 'note'; text: string }

export function WiringLab({ wiring, onChange }: { wiring: Connections; onChange: (wiring: Connections) => void }) {
  const [selected, setSelected] = useState<LeadId | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const wired = leadIds.flatMap(lead => {
    const port = getPort(wiring[lead])
    return port ? [{ lead, port }] : []
  })
  const expansionComplete = Boolean(wiring['expansion-power'] && wiring['expansion-data'])

  function connect(id: string) {
    const port = getPort(id)
    if (!port) return
    if (!selected) {
      setFeedback({ kind: 'note', text: 'Алдымен жалғайтын кабельді таңда.' })
      return
    }
    const error = connectionError(selected, port, wiring)
    if (error) {
      setFeedback({ kind: 'bad', text: port.label + ' портына жалғау қабылданбады. ' + error })
      return
    }
    onChange({ ...wiring, [selected]: id })
    setFeedback({
      kind: 'good',
      text: leads[selected].label + ' → ' + port.label + ' қосылды.' +
        (id === 'i2c-0' ? ' Бұл арнада кіріктірілген IMU бар. Сыртқы датчик үшін бос I2C 1–3 арнасын таңдаған ыңғайлы.' : ''),
    })
  }

  function disconnect(lead: LeadId) {
    const next = { ...wiring }
    delete next[lead]
    onChange(next)
    setFeedback({ kind: 'note', text: leads[lead].label + ' ажыратылды. Оны басқа портқа жалғауға болады.' })
  }

  return (
    <section className="hw-panel" aria-labelledby="wiring-title">
      <div className="hw-section-head">
        <div><h2 id="wiring-title" lang="en">Wiring Lab</h2>
          <p>Кабельді таңда, содан кейін Control Hub (басқару блогы) үстіндегі портты бас.</p></div>
        <span className="hw-count">{wired.length}/{leadIds.length} қосылым</span>
      </div>
      <div className="hw-note">
        <strong>Жеңілдетілген оқу сұлбасы</strong>
        <p>Сұлба порттың қызметі мен үйлесімділігін көрсетеді. Нақты қосқыштың бағыты, кернеу, түйіспелер және қорек тізбегі мұнда модельденбейді. Нақты роботта қуатты ажыратып, өндірушінің сұлбасын тексер. Battery (аккумулятор) қорегі Power Switch (қуат ажыратқышы) арқылы беріледі.</p>
      </div>
      <div className="hw-wiring-layout">
        <fieldset className="hw-rack">
          <legend>1. Кабельді таңда</legend>
          <div className="hw-leads">
            {leadIds.map(id => (
              <button key={id} type="button" aria-pressed={selected === id} className="hw-lead"
                onClick={() => {
                  setSelected(id)
                  setFeedback(null)
                }}>
                <span lang="en">{leads[id].label}</span>
                {wiring[id] && <small lang="en">{getPort(wiring[id])?.label}</small>}
              </button>
            ))}
          </div>
          <p className="hw-muted">Chassis (шасси) пен Mecanum Wheel (жан-жаққа қозғалуға арналған дөңгелек) механикалық түрде бекітіледі. Кіріктірілген IMU (инерциялық өлшеу модулі) үшін кабель қажет емес. Сымды Gamepad (ойын контроллері) Driver Hub (оператор құрылғысы) портына жалғанады.</p>
        </fieldset>
        <fieldset className="hw-rack">
          <legend>2. Портты таңда</legend>
          <div className="hw-hub-label"><span aria-hidden="true" /> <strong lang="en">CONTROL HUB</strong></div>
          {portGroups.map(group => (
            <div key={group.title} className="hw-port-group">
              <h3 lang="en">{group.title}</h3>
              <div>
                {group.ports.map(port => {
                  const occupant = wired.find(wire => wire.port.id === port.id)
                  return (
                    <button key={port.id} type="button" className="hw-port" data-connected={Boolean(occupant)}
                      aria-label={occupant ? port.label + ' · ' + leads[occupant.lead].label + ' қосылған' : port.label}
                      onClick={() => connect(port.id)}>
                      <span aria-hidden="true" /> <span lang="en">{port.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="hw-muted">XT30 IN, XT30 OUT және RS485 A/B — осы сұлбадағы белгілер. I2C (сандық дерек алмасу шинасы) үшін әр портқа бір сыртқы кабель көрсетіледі.</p>
        </fieldset>
      </div>
      <div role="status" className="hw-feedback" data-kind={feedback?.kind ?? 'note'}>
        {feedback ? (
          <><strong>{feedback.kind === 'bad' ? 'Қосылым қате' : feedback.kind === 'good' ? 'Қосылым дұрыс' : 'Нұсқау'}</strong><p>{feedback.text}</p></>
        ) : (
          <p>{selected ? leads[selected].label + ' таңдалды. Енді портты бас.' : 'Алғашқы кабельді таңда.'}</p>
        )}
      </div>
      <div className="hw-diagram">
        <div className="hw-section-head">
          <div><h3>Қосылымдар сұлбасы</h3>
            <p>Портты қайта таңдасаң, кабель жаңа орынға ауысады.</p></div>
          {wired.length > 0 && (
            <button type="button" className="hw-button hw-button-secondary" onClick={() => {
              onChange({})
              setFeedback({ kind: 'note', text: 'Барлық кабель ажыратылды.' })
            }}>Барлығын ажырату</button>
          )}
        </div>
        {wired.length ? (
          <ul className="hw-wires">
            {wired.map(({ lead, port }) => (
              <li key={lead}>
                <span lang="en">{leads[lead].label}</span>
                <svg viewBox="0 0 120 20" preserveAspectRatio="none" fill="none" aria-hidden="true">
                  <path d="M3 4h30c23 0 21 12 44 12h40" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <circle cx="3" cy="4" r="2.5" fill="currentColor" /><circle cx="117" cy="16" r="2.5" fill="currentColor" />
                </svg>
                <strong lang="en">{port.label}</strong>
                <button type="button" className="hw-remove" aria-label={leads[lead].label + ' кабелін ажырату'}
                  onClick={() => disconnect(lead)}>Ажырату</button>
              </li>
            ))}
          </ul>
        ) : <p className="hw-muted">Дұрыс жалғанған кабельдер осында көрінеді.</p>}
        {(wiring['expansion-power'] || wiring['expansion-data']) && (
          <p className="hw-muted">Expansion Hub (кеңейту блогы) · {expansionComplete
            ? 'Қорек пен дерек кабельдері жалғанды.'
            : 'Қосылымды аяқтау үшін қорек пен дерек кабельдерінің екеуі де қажет.'}</p>
        )}
        {wired.length === leadIds.length && <p className="hw-success">Барлық оқу қосылымы дұрыс жалғанды.</p>}
      </div>
      <SourceLinks ids={['ports', 'wiring', 'firstPorts', 'expansion', 'i2c']} />
    </section>
  )
}
