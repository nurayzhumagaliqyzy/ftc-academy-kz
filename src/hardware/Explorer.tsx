import { useState } from 'react'
import { hardware, sources } from './components'
import type { ComponentId, SourceId } from './components'

const drawings: Record<ComponentId, string> = {
  chassis: 'M18 38 49 21l31 17-31 17zM18 38v9l31 17 31-17v-9M49 55v9M29 32l31 17M39 27l31 17M29 44l31-17M39 49l31-17M25 39h.1m10-5h.1m28 4h.1m7 5h.1',
  'control-hub': 'M13 17h70v41H13zM28 23h33v28H28zM34 29h21v16H34zM16 24h8v5h-8zm0 9h8v5h-8zm0 9h8v5h-8zM66 24h12v7H66zm0 11h12v7H66zm0 11h12v7H66zM37 34h15m-15 6h10',
  'expansion-hub': 'M17 12h62v49H17zM24 19h48v29H24zM30 25h8v8h-8zm14 0h8v8h-8zm14 0h8v8h-8zM30 39h36M24 54h10m8 0h10m8 0h10M13 25H7v22h6m70-22h6v22h-6',
  'dc-motor': 'M17 23h49a12 12 0 0 1 12 12v4a12 12 0 0 1-12 12H17zM17 23c-10 0-10 28 0 28s10-28 0-28zM78 33h12v8H78M32 28v18m8-18v18M16 51v9l8 6m1-15v7l10 5',
  'servo-motor': 'M19 26h55v32H19zM12 38h7m55 0h9m-64 5h-7m62 0h9M35 26v-9h21v9M45 17v-7h31v6H45m-12 42v7l15 4m-9-11v4l14 4M26 34h39v15H26z',
  encoder: 'M70 35a23 23 0 1 1-46 0 23 23 0 1 1 46 0zM55 35a8 8 0 1 1-16 0 8 8 0 1 1 16 0zM47 15v6m0 28v6m-20-20h6m28 0h6M70 30h12v11H70m12-8h7m-7 5h7',
  'distance-sensor': 'M14 23h39v27H14zM22 30h10v13H22zm14 0h10v13H36zM55 34l23-15m-23 19h28m-28 4 23 14M82 15v44m-55-9v10m8-10v10',
  'color-sensor': 'M18 18h60v37H18zM25 24h46v25H25zM40 36a6 6 0 1 1-12 0 6 6 0 1 1 12 0zM53 36a6 6 0 1 1-12 0 6 6 0 1 1 12 0zM66 36a6 6 0 1 1-12 0 6 6 0 1 1 12 0zM40 55v8m8-8v8m8-8v8',
  imu: 'M29 30l18-10 20 10-20 10zM29 30v21l18 11 20-11V30M47 40v22M47 20V7m-4 5 4-5 4 5M67 51l16 9m-2-6 2 6-7 1M29 51l-16 9m2-6-2 6 7 1M37 30l10-5 10 5-10 5z',
  'mecanum-wheel': 'M68 37a22 22 0 1 1-44 0 22 22 0 1 1 44 0zM56 37a10 10 0 1 1-20 0 10 10 0 1 1 20 0zM43 15l8 13M28 23l13 7M24 38l13-4m-6 17 12-8m6 16-4-13m17 7-9-12m15-5-12 3m7-17-12 9M69 22l10 8v14l-12 9',
  gamepad: 'M29 22h38q10 0 13 12l4 13q3 10-5 12-5 2-12-9l-4-4H33l-4 4q-7 11-12 9-8-2-5-12l4-13q3-12 13-12zM28 31v13m-6-7h12m28-6h.1m7 6h.1m-7 7h.1m-7-7h.1M45 22v-8h10V8',
  battery: 'M17 23h58v31H17zm58 9h7v13h-7m-48-7h10m-5-5v10m28-5h9M41 49l11-14h-7l6-9m-34 3H9v20h8',
}

function HardwareVisual({ id, large = false }: { id: ComponentId; large?: boolean }) {
  return (
    <svg className={large ? 'hw-drawing hw-drawing-large' : 'hw-drawing'} viewBox="0 0 96 72"
      fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={drawings[id]} />
    </svg>
  )
}

export function SourceLinks({ ids }: { ids: readonly SourceId[] }) {
  return (
    <div className="hw-sources">
      <h3>Ресми құжаттар</h3>
      <ul>{ids.map(id => (
        <li key={id}><a href={sources[id].url} lang="en">{sources[id].title}</a></li>
      ))}</ul>
    </div>
  )
}

export function Explorer({ explored, onExplore }: {
  explored: readonly ComponentId[]
  onExplore: (id: ComponentId) => void
}) {
  const [selected, setSelected] = useState<ComponentId | null>(null)
  const item = hardware.find(component => component.id === selected)

  return (
    <section className="hw-panel" aria-labelledby="explorer-title">
      <div className="hw-section-head">
        <div><h2 id="explorer-title" lang="en">Hardware Explorer</h2>
          <p>Карточканы таңда. Бөлшектің қызметін, қосылымын және қолдану мысалын оқы.</p></div>
        <span className="hw-count">{explored.length}/{hardware.length} қаралды</span>
      </div>
      <div className="hw-explorer-layout">
        <ul className="hw-component-grid" aria-label="Бөлшектер">
          {hardware.map(component => (
            <li key={component.id}>
              <button type="button" className="hw-component" aria-expanded={component.id === selected}
                aria-controls="hw-component-detail" onClick={() => {
                  setSelected(component.id === selected ? null : component.id)
                  onExplore(component.id)
                }}>
                <HardwareVisual id={component.id} />
                <strong lang="en">{component.name}</strong>
                <span>{component.group}{explored.includes(component.id) ? ' · Қаралды' : ''}</span>
              </button>
              {component.id === selected && (
                <a className="hw-read-link" href="#hw-component-detail" onClick={event => {
                  event.preventDefault()
                  const detail = document.getElementById('hw-component-detail')
                  detail?.focus({ preventScroll: true })
                  detail?.scrollIntoView({ block: 'start' })
                }}>Түсіндірмеге өту</a>
              )}
            </li>
          ))}
        </ul>
        <div id="hw-component-detail" className="hw-detail" role="region" tabIndex={-1}
          aria-label={item ? item.name + ' түсіндірмесі' : 'Бөлшек түсіндірмесі'}>
          {item ? (
            <>
              <div className="hw-detail-hero">
                <HardwareVisual id={item.id} large />
                <h3><span lang="en">{item.name}</span> <small>({item.gloss})</small></h3>
              </div>
              <p>{item.description}</p>
              <dl className="hw-facts">
                <div><dt>Роботтағы қызметі</dt><dd>{item.role}</dd></div>
                <div><dt>Қосылымы</dt><dd>{item.connection}</dd></div>
                <div><dt>Қолдану мысалы</dt><dd>{item.example}</dd></div>
              </dl>
              <h4>Жиі кездесетін қателер</h4>
              <ul className="hw-list">{item.mistakes.map(mistake => <li key={mistake}>{mistake}</li>)}</ul>
              <SourceLinks ids={item.sources} />
            </>
          ) : (
            <div className="hw-empty"><strong>Бөлшекті таңда</strong><p>Мысалы, <span lang="en">Control Hub</span> карточкасын ашып, оның порттары не үшін қажет екенін қара.</p></div>
          )}
        </div>
      </div>
    </section>
  )
}
