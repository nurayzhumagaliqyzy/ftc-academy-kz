import { useEffect, useState } from 'react'
import { advanceMission, commandLabels, editProgram, initialMission, maxMissionCommands, missions, observeDistance, pauseMission, samePoint, startMission, stepMission } from './integratedModel'
import type { MissionCommand, MissionId, MissionState } from './integratedModel'
const arrows = { N: '↑', E: '→', S: '↓', W: '←' }
const stateLabels = { ready: 'Жоспар дайындалуда', running: 'Орындалуда', paused: 'Үзіліс', success: 'Миссия сәтті', failed: 'Қайта сынау қажет' }
export function IntegratedLab({ solved, onSuccess, onRetry }: { solved: MissionId[]; onSuccess: (id: MissionId) => void; onRetry: () => void }) {
  const [missionIndex, setMissionIndex] = useState(0)
  const mission = missions[missionIndex]
  const [commands, setCommands] = useState<MissionCommand[]>([])
  const [state, setState] = useState<MissionState>(() => initialMission(missions[0]))
  const [reducedMotion, setReducedMotion] = useState(false)
  const active = state.status === 'running'
  useEffect(() => { const query=window.matchMedia('(prefers-reduced-motion: reduce)'); const update=()=>setReducedMotion(query.matches); update(); query.addEventListener('change',update); return ()=>query.removeEventListener('change',update) }, [])
  useEffect(() => {
    if (!active || reducedMotion) return
    // The interval only paces discrete commands. It does not model velocity or motor physics.
    const timer=window.setInterval(()=>setState(previous=>advanceMission(previous,commands,mission)),650)
    const hide=()=>{if(document.hidden)setState(pauseMission)}
    document.addEventListener('visibilitychange',hide)
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',hide)}
  },[active,commands,mission,reducedMotion])
  useEffect(()=>{ if(reducedMotion)setState(pauseMission) },[reducedMotion])
  useEffect(()=>{ if(state.status==='success' && !solved.includes(mission.id))onSuccess(mission.id) },[state.status,solved,mission.id,onSuccess])
  function edit(operation: Parameters<typeof editProgram>[1]) { if(active)return; setCommands(previous=>editProgram(previous,operation));setState(initialMission(mission)) }
  function choose(index: number) {setMissionIndex(index);setCommands([]);setState(initialMission(missions[index]))}
  const distance=observeDistance(state,mission)
  const terminal=state.status==='success'||state.status==='failed'
  const objectLabel=state.object.status==='carried'?'Робот ішінде':state.object.status==='delivered'?'Аймақта босатылды':`Алаңда (${state.object.position.x},${state.object.position.y})`
  return <section className="hw-panel im-lab" aria-labelledby="im-lab">
    <div className="hw-section-head"><div><p className="hw-kicker">AUTONOMOUS / ҚОРЫТЫНДЫ ПРАКТИКА</p><h2 id="im-lab" tabIndex={-1}>Integrated Mission Lab</h2></div><span className="hw-count">{solved.length}/3 миссия</span></div>
    <div className="pl-jumps" aria-label="Миссияны таңдау">{missions.map((m,i)=><button type="button" className="hw-button hw-button-secondary" key={m.id} disabled={active} aria-pressed={i===missionIndex} onClick={()=>choose(i)}>{solved.includes(m.id)?'✓ ':''}{m.title}</button>)}</div>
    <h3>{mission.title}</h3><p>{mission.goal}</p>
    <p className="hw-note">Бастау: ({mission.start.x},{mission.start.y}), {mission.direction} {arrows[mission.direction]}, Claw жабық. Жеткізу аймағы: ({mission.zone.x},{mission.zone.y}); осы миссияның нақты мақсаты жоғарыда. Әр миссия өз бастапқы күйінен басталады.</p>
    <details><summary>Ереже және шартты блок қалай жұмыс істейді?</summary><ul className="hw-list">
      <li>Алаң 5×5: x солдан оңға, y жоғарыдан төмен, 0…4. N — солтүстік, E — шығыс, S — оңтүстік, W — батыс. Алға — бағыт көрсеткіші бойынша бір ұяшық. Бұрылыс тек бағытты өзгертеді.</li>
      <li>Қабырға не шетке Move Forward — қате: орын өзгермейді, орындау тоқтайды. Reset және пәрменді түзету арқылы қайта сына.</li>
      <li>Затпен бір ұяшықта, Claw ашық кезде Close Claw затты жинайды. Жабық Claw-ды қайта жабу затты жинамайды. Open Claw тасылған затты сол жерде түсіреді; тек target zone ішінде босату — delivery.</li>
      <li>Read Distance алдыңғы қабырға/шекараға дейінгі бос ұяшықтарды санайды. 0 — келесі ұяшық жабық. Зат пен zone қабырға емес. IF-OBSTACLE дәл қазір қайта оқиды: 0 болса солға 90°, әйтпесе бір ұяшық алға. Бұл шағын if/else блогы.</li>
      <li>Әр сәтті алға қадам +100 шартты tick. Бұрылыс tick қоспайды. Бұл нақты Encoder көрсеткіші де, сантиметр де емес. Grid физика, RPM не нақты мотор динамикасын есептемейді.</li>
      <li>Барлық мақсаттан кейін Stop қажет. Ерте Stop және Stop-сыз біткен тізім өтпейді. Pause — жалғастыруға болатын үзіліс. Reset модельді бастапқы күйге қайтарады; нақты Encoder reset-пен бірдей емес.</li>
    </ul></details>
    <details><summary>Көмек / маршрутқа ишара</summary><p>{mission.hint}</p></details>
    <div className="im-workspace">
      <div className="im-field-panel">
        <div className="im-field" role="img" aria-label={`5×5 алаң. Робот (${state.position.x},${state.position.y}) ${state.direction}. Зат: ${objectLabel}. Қабырғалар: ${mission.walls.map(p=>`(${p.x},${p.y})`).join(', ')}. Бастау (${mission.start.x},${mission.start.y}), мақсат (${mission.zone.x},${mission.zone.y}).`}>
          {Array.from({length:25},(_,index)=>{const p={x:index%5,y:Math.floor(index/5)}; const robot=samePoint(p,state.position);const wall=mission.walls.some(w=>samePoint(w,p));const object=state.object.status!=='carried'&&samePoint(p,state.object.position);const zone=samePoint(p,mission.zone);const visited=state.path.some(v=>samePoint(v,p));return <div key={index} className="im-cell" data-wall={wall||undefined} data-zone={zone||undefined} data-visited={visited||undefined} aria-hidden="true"><small>{p.x},{p.y}</small>{wall?<span className="im-wall">▦</span>:<><span className="im-landmark">{zone?'◎':samePoint(p,mission.start)?'S':''}</span>{object&&<span className="im-object">◆</span>}{visited&&!robot&&<span className="im-trail">●</span>}{robot&&<span className="im-robot">{arrows[state.direction]}<sup>{state.object.status==='carried'?'◆':state.claw==='open'?'◡':'∩'}</sup></span>}</>}</div>})}
        </div>
        <p className="hw-muted">S — start · ▦ — қабырға · ◆ — зат · ◎ — delivery zone · ● — жүрілген із · ↑→↓← — робот бағыты</p>
        <dl className="im-telemetry"><div><dt>Робот</dt><dd>({state.position.x},{state.position.y}) · {state.direction} {arrows[state.direction]}</dd></div><div><dt>Claw / зат</dt><dd>{state.claw} / {objectLabel}</dd></div><div><dt>Sensor · live grid</dt><dd>{distance.cells} бос ұяшық · {distance.blocked?'жабық':'бос'}</dd></div><div><dt>Қозғалыс / оқу Encoder</dt><dd>{state.moves} қадам / {state.ticks} шартты tick</dd></div><div><dt>Пәрмен күйі</dt><dd>{stateLabels[state.status]} · {state.nextIndex}/{commands.length}</dd></div><div><dt>Шешім дәлелі</dt><dd>Бөгет: {state.sawObstacle?'байқалды':'әлі жоқ'} · IF: {state.conditionalUsed?'қолданылды':'әлі жоқ'}</dd></div></dl>
        <details><summary>Жүрілген ізді мәтінмен оқу</summary><p>{state.path.map(p=>`(${p.x},${p.y})`).join(' → ')}</p><p>Бұрылыс ұяшық қоспайды; тізім тек бастапқы және сәтті жүрген ұяшықтарды қамтиды.</p></details>
        <p className="hw-muted">{state.observation?`Соңғы Read/IF: (${state.observation.position.x},${state.observation.position.y}), ${state.observation.direction}, ${state.observation.cells} бос ұяшық. Бұл сақталған бақылау; live мән жоғарыда.`:'Read/IF әлі орындалған жоқ. Live grid көрсеткіші оқу үшін үнемі көрінеді, бірақ миссияның бақылау дәлелі пәрменнен кейін ғана тіркеледі.'}</p>
        <div className="hw-feedback" role="status" aria-live="polite" data-kind={state.status==='failed'?'bad':state.status==='success'?'good':undefined}><strong>{stateLabels[state.status]}</strong><p>{state.message}</p></div>
      </div>
      <div className="im-editor"><h3>Пәрмен редакторы · {commands.length}/{maxMissionCommands}</h3><p>Батырманы басып тізімге қос. ↑/↓ арқылы ретте. Орындау кезінде редактор жабық; үзілістегі өзгеріс модельді бастапқы күйге қайтарады.</p>
        <div className="im-command-palette">{(Object.keys(commandLabels) as MissionCommand[]).map(command=><button type="button" className="hw-button hw-button-secondary" key={command} disabled={active||commands.length>=maxMissionCommands} onClick={()=>edit({type:'add',command})}>{commandLabels[command]}</button>)}</div>
        <ol className="im-program" aria-label="Миссия пәрмендері">{commands.map((command,index)=><li key={index} aria-current={state.lastIndex===index?'step':undefined} data-next={!terminal&&state.nextIndex===index||undefined}><span>{index+1}. {commandLabels[command]}{state.lastIndex===index?' · соңғы орындалған':!terminal&&state.nextIndex===index?' · келесі':''}</span><div><button type="button" disabled={active||index===0} aria-label={`${index+1}-пәрменді жоғары`} onClick={()=>edit({type:'move',index,delta:-1})}>↑</button><button type="button" disabled={active||index===commands.length-1} aria-label={`${index+1}-пәрменді төмен`} onClick={()=>edit({type:'move',index,delta:1})}>↓</button><button type="button" disabled={active} aria-label={`${index+1}-пәрменді өшіру`} onClick={()=>edit({type:'delete',index})}>×</button></div></li>)}</ol>
        {commands.length===0&&<p>Тізім бос. Алғашқы пәрменді жоғарыдан қос.</p>}
        <div className="im-controls"><button type="button" className="hw-button" disabled={active||terminal||!commands.length||reducedMotion} onClick={()=>setState(previous=>startMission(previous,commands))}>{state.status==='paused'?'Жалғастыру':'Run · орындау'}</button><button type="button" className="hw-button hw-button-secondary" disabled={!active} onClick={()=>setState(pauseMission)}>Pause · үзіліс</button><button type="button" className="hw-button hw-button-secondary" disabled={active||terminal||!commands.length} onClick={()=>setState(previous=>stepMission(previous,commands,mission))}>Step · бір пәрмен</button><button type="button" className="hw-button hw-button-secondary" onClick={()=>setState(initialMission(mission))}>Reset · қайта сынау</button><button type="button" className="hw-button hw-button-secondary" disabled={active||!commands.length} onClick={()=>{setCommands([]);setState(initialMission(mission))}}>Тізімді тазарту</button></div>
        {reducedMotion&&<p className="hw-note">Reduced motion қосулы: автоматты playback өшірілді. Step батырмасымен барлық миссияны орындауға болады.</p>}
        <p className="hw-muted">Reset тізімді және бұрынғы сәтті нәтижелерді сақтайды. Миссия ауыстыру тізімді тазартады. Run тек экран қарқынын реттейді, қадам ережесі уақытқа тәуелсіз.</p>
      </div>
    </div>
    <details><summary>Жоспарға сәйкес оқу псевдокоды</summary><pre tabIndex={0}><code>{commands.map((c,i)=>`${i+1}. ${commandLabels[c]}`).join('\n')||'// Пәрмен қос'}</code></pre><p>Бұл Java емес. IF-OBSTACLE блогының семантикасы: if (frontBlockedNow) turnLeft90(); else moveOneCell(); Бұл атаулар FTC SDK әдістері емес.</p></details>
    <button type="button" className="hw-button hw-button-secondary" disabled={active||!solved.length} onClick={()=>{onRetry();setState(initialMission(mission))}}>Үш миссияны қайта бағалау</button><p className="hw-muted">Қайта бағалау тек осы сабақтың үш миссия дәлелі мен аяқтау белгісін тазартады; басқа бағалар сақталады.</p>
  </section>
}
