import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import * as m from '../src/programming/integratedModel.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'
import { storageKey, legacyStorageKey } from '../src/programming/model.ts'
import { motorStorageKey, legacyMotorStorageKey } from '../src/programming/motorModel.ts'
import { gamepadStorageKey, legacyGamepadStorageKey } from '../src/programming/gamepadModel.ts'
import { autonomousStorageKey, legacyAutonomousStorageKey } from '../src/programming/autonomousModel.ts'
import { servoStorageKey } from '../src/programming/servoModel.ts'
import { sensorStorageKey } from '../src/programming/sensorModel.ts'
import { encoderStorageKey } from '../src/programming/encoderModel.ts'
const storageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
afterEach(()=>{if(storageDescriptor)Object.defineProperty(globalThis,'localStorage',storageDescriptor);else delete globalThis.localStorage})
function execute(mission,commands=mission.reference,initial=m.initialMission(mission)) {let s=m.startMission(initial,commands);for(let i=0;i<=commands.length&&s.status==='running';i++)s=m.advanceMission(s,commands,mission);return s}
function ready(){return m.normalizeIntegratedProgress({read:m.integratedReadings.map(x=>x.id),solved:m.missions.map(x=>x.id),code:Object.fromEntries(m.integratedCodeTasks.map(x=>[x.id,x.answer])),answers:Object.fromEntries(m.integratedQuestions.map(x=>[x.id,x.answer])),scenarioAnswer:m.integratedScenario.answer})}
test('eight unique routes retain all seven lesson hashes and reject nonexistent lessons',()=>{
 assert.deepEqual(programmingLessons.map(x=>programmingSectionFor(x.hash)),['sdk-opmode','dc-motor','gamepad-teleop','autonomous','servo','sensors','encoder','integrated-challenge'])
 assert.equal(new Set(programmingLessons.map(x=>x.hash)).size,8)
 for(const hash of ['programming/9','programming/integrated-challenge/other','programming/8'])assert.equal(programmingSectionFor(hash),undefined)
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.match(app,/programmingLessons/)
 const module=readFileSync(new URL('../src/programming/ProgrammingModule.tsx',import.meta.url),'utf8');assert.match(module,/section === 'integrated-challenge'/);assert.match(module,/progress\.every/)
})
test('all three reference solutions achieve distinct objectives within command limit',()=>{
 for(const mission of m.missions){const s=execute(mission);assert.equal(s.status,'success',mission.id+': '+s.message);assert.equal(m.missionObjective(s,mission),true);assert.equal(s.nextIndex,mission.reference.length);assert.ok(mission.reference.length<=m.maxMissionCommands);assert.equal(mission.reference.at(-1),'stop')}
 assert.equal(execute(m.missions[0]).object.status,'carried');assert.equal(execute(m.missions[1]).pickedUp,false);assert.equal(execute(m.missions[2]).object.status,'delivered')
})
test('start states, field data and reference inputs are not mutated',()=>{
 for(const mission of m.missions){const initial=m.initialMission(mission);const copy=structuredClone(initial);const spec=structuredClone(mission);execute(mission,mission.reference,initial);assert.deepEqual(initial,copy);assert.deepEqual(mission,spec);assert.equal(initial.claw,'closed');assert.equal(initial.object.status,'ground');assert.equal(initial.path.length,1)}
})
test('movement is cardinal, one cell, fixed illustrative ticks, and turns do not translate',()=>{
 const mission=m.missions[0];let s=m.initialMission(mission)
 const commands=['forward','left','forward','right','stop'];s=m.startMission(s,commands)
 s=m.advanceMission(s,commands,mission);assert.deepEqual(s.position,{x:1,y:4});assert.equal(s.ticks,100)
 s=m.advanceMission(s,commands,mission);assert.equal(s.direction,'N');assert.deepEqual(s.position,{x:1,y:4});assert.equal(s.ticks,100)
 s=m.advanceMission(s,commands,mission);assert.deepEqual(s.position,{x:1,y:3});assert.equal(s.moves,2);assert.equal(s.ticks,200);assert.equal(s.path.length,3)
 for(const direction of ['N','E','S','W']){let r={...m.initialMission(mission),direction};for(let i=0;i<4;i++)r=m.stepMission(r,['right','right','right','right','stop'],mission);assert.equal(r.direction,direction);assert.deepEqual(r.position,mission.start)}
})
test('all boundary directions prevent movement without inflating counters or trail',()=>{
 const mission=m.missions[0]
 for(const [position,direction] of [[{x:0,y:0},'N'],[{x:0,y:0},'W'],[{x:4,y:4},'E'],[{x:4,y:4},'S']]){
  const initial={...m.initialMission(mission),position,direction};const s=execute(mission,['forward','stop'],initial);assert.equal(s.status,'failed');assert.deepEqual(s.position,position);assert.equal(s.moves,0);assert.equal(s.ticks,0);assert.equal(s.nextIndex,1)
 }
})
test('obstacle collisions fail and do not move the robot; no post-failure execution',()=>{
 const mission=m.missions[1],s=execute(mission,['forward','right','stop']);assert.equal(s.status,'failed');assert.deepEqual(s.position,mission.start);assert.equal(s.direction,'E');assert.equal(s.lastIndex,0);assert.deepEqual(m.advanceMission(s,['forward','right','stop'],mission),s)
})
test('sensor counts free grid cells to wall or boundary, ignores object and zone',()=>{
 const mission=m.missions[0],s=m.initialMission(mission);assert.equal(m.observeDistance(s,mission).cells,4)
 const blocked=m.observeDistance(m.initialMission(m.missions[1]),m.missions[1]);assert.equal(blocked.cells,0);assert.equal(blocked.blocked,true)
 for(let y=0;y<5;y++)for(let x=0;x<5;x++)for(const direction of ['N','E','S','W']){if(m.isWall({x,y},mission))continue;const o=m.observeDistance({...s,position:{x,y},direction},mission);assert.ok(Number.isInteger(o.cells)&&o.cells>=0&&o.cells<=4);assert.equal(o.blocked,o.cells===0)}
})
test('Read records observation origin and IF recomputes the current direction',()=>{
 const mission=m.missions[1];let s=m.startMission(m.initialMission(mission),['read','left','ifObstacle','stop'])
 s=m.advanceMission(s,['read','left','ifObstacle','stop'],mission);assert.equal(s.sawObstacle,true);assert.equal(s.observation.direction,'E')
 s=m.advanceMission(s,['read','left','ifObstacle','stop'],mission);assert.equal(s.observation.direction,'E');assert.equal(s.direction,'N')
 s=m.advanceMission(s,['read','left','ifObstacle','stop'],mission);assert.equal(s.observation.direction,'N');assert.equal(s.observation.cells,2);assert.deepEqual(s.position,{x:0,y:1});assert.equal(s.conditionalUsed,false)
})
test('IF blocked branch turns left, free branch moves once; observation alone is not a conditional',()=>{
 const blocked=m.stepMission(m.initialMission(m.missions[1]),['ifObstacle','stop'],m.missions[1]);assert.equal(blocked.direction,'N');assert.equal(blocked.moves,0);assert.equal(blocked.conditionalUsed,true);assert.equal(blocked.sawObstacle,true)
 const free=m.stepMission(m.initialMission(m.missions[0]),['ifObstacle','stop'],m.missions[0]);assert.deepEqual(free.position,{x:1,y:4});assert.equal(free.ticks,100);assert.equal(free.sawObstacle,false)
 const atZone={...blocked,position:{...m.missions[1].zone},moves:1,conditionalUsed:false};assert.equal(m.missionObjective(atZone,m.missions[1]),false)
})
test('collection requires object location and an open-to-closed transition',()=>{
 const mission=m.missions[0]
 for(const commands of [['forward','forward','close','stop'],['open','close','forward','forward','stop'],['open','forward','close','stop']]){const s=execute(mission,commands);assert.equal(s.status,'failed');assert.equal(s.pickedUp,false)}
 const s=execute(mission);assert.equal(s.pickedUp,true);assert.equal(s.claw,'closed');assert.deepEqual(s.object.position,s.position)
})
test('carried object follows robot; off-zone drop can be recollected',()=>{
 const mission=m.missions[0],commands=['open','forward','forward','close','left','forward','open','close','stop'];let s=m.startMission(m.initialMission(mission),commands)
 for(let i=0;i<6;i++)s=m.advanceMission(s,commands,mission)
 assert.deepEqual(s.object.position,s.position);assert.equal(s.object.status,'carried')
 s=m.advanceMission(s,commands,mission);assert.equal(s.object.status,'ground');assert.equal(s.claw,'open')
 s=m.advanceMission(s,commands,mission);assert.equal(s.object.status,'carried');s=m.advanceMission(s,commands,mission);assert.equal(s.status,'success')
})
test('full delivery rejects merely reaching zone, no pickup, unreleased object and wrong drop',()=>{
 const mission=m.missions[2],valid=execute(mission)
 assert.equal(m.missionObjective(valid,mission),true)
 for(const patch of [{pickedUp:false},{claw:'closed'},{object:{...valid.object,status:'carried'}},{object:{...valid.object,position:{x:0,y:0}}},{conditionalUsed:false},{sawObstacle:false}])assert.equal(m.missionObjective({...valid,...patch},mission),false)
 const noPickup=mission.reference.filter(c=>c!=='close');assert.equal(execute(mission,noPickup).status,'failed')
 const unreleased=[...mission.reference];unreleased.splice(-2,1);assert.equal(execute(mission,unreleased).status,'failed')
})
test('missing Stop and premature Stop cannot pass, Stop ends remaining execution',()=>{
 for(const mission of m.missions){assert.equal(execute(mission,mission.reference.slice(0,-1)).status,'failed');assert.equal(execute(mission,['stop',...mission.reference]).status,'failed');const s=execute(mission,[...mission.reference,'forward']);assert.equal(s.status,'success');assert.equal(s.nextIndex,mission.reference.length)}
})
test('invalid, empty and excessive programs fail safely, including malicious command names',()=>{
 const mission=m.missions[0]
 for(const commands of [[],['fly'],['__proto__'],['constructor'],[NaN],Array(33).fill('read')]){const s=execute(mission,commands);assert.equal(s.status,'failed');assert.deepEqual(s.position,mission.start);assert.equal(s.moves,0)}
 assert.equal(m.validateProgram(Array(32).fill('read')),undefined)
})
test('pause/resume, terminal guards, one-step execution and reset are deterministic',()=>{
 const mission=m.missions[2],commands=mission.reference;let s=m.startMission(m.initialMission(mission),commands);s=m.advanceMission(s,commands,mission);s=m.pauseMission(s);assert.equal(s.status,'paused');assert.deepEqual(m.advanceMission(s,commands,mission),s)
 const resumed=execute(mission,commands,s);assert.equal(resumed.status,'success');assert.deepEqual(m.startMission(resumed,commands),resumed)
 let stepped=m.initialMission(mission);for(let i=0;i<commands.length;i++){stepped=m.stepMission(stepped,commands,mission);if(i<commands.length-1)assert.equal(stepped.status,'paused')}assert.deepEqual(stepped.position,resumed.position);assert.equal(stepped.ticks,resumed.ticks)
 assert.deepEqual(m.initialMission(mission),m.initialMission(mission));assert.equal(m.initialMission(mission).ticks,0);assert.equal(m.initialMission(mission).pickedUp,false)
})
test('editor adds/deletes/reorders with limits and prevents edits during playback',()=>{
 let p=[];for(let i=0;i<40;i++)p=m.editProgram(p,{type:'add',command:'forward'});assert.equal(p.length,32);assert.equal(m.editProgram(p,{type:'add',command:'stop'}).length,32)
 p=['open','forward','stop'];assert.deepEqual(m.editProgram(p,{type:'move',index:1,delta:-1}),['forward','open','stop']);assert.deepEqual(m.editProgram(p,{type:'delete',index:1}),['open','stop'])
 for(const op of [{type:'add',command:'stop'},{type:'delete',index:0},{type:'move',index:1,delta:1}])assert.deepEqual(m.editProgram(p,op,true),p)
 assert.deepEqual(m.editProgram(p,{type:'move',index:0,delta:-1}),p);assert.deepEqual(m.editProgram(p,{type:'delete',index:-1}),p);assert.deepEqual(m.editProgram(p,{type:'add',command:'fly'}),p)
})
test('five Java tasks score only correct meaningful API choices',()=>{
 const p=ready();assert.equal(m.integratedCodeScore(p),5)
 for(const task of m.integratedCodeTasks){const wrong=task.options.find(o=>o!==task.answer);assert.equal(m.integratedCodeScore({...p,code:{...p.code,[task.id]:wrong}}),4);assert.equal(m.canCompleteIntegrated({...p,code:{...p.code,[task.id]:wrong}}),false)}
})
test('quiz needs five answers with at least four correct; retry preserves other evidence',()=>{
 const p=ready();delete p.answers.mode;assert.equal(m.integratedQuizScore(p),4);assert.equal(m.integratedQuizPassed(p),false)
 p.answers.mode=0;assert.equal(m.integratedQuizPassed(p),true);p.answers.invalid=0;assert.equal(m.integratedQuizScore(p),3);assert.equal(m.integratedQuizPassed(p),false)
 const retry=m.normalizeIntegratedProgress({...ready(),answers:{},completed:false});assert.equal(m.integratedQuizPassed(retry),false);assert.equal(retry.solved.length,3);assert.equal(m.integratedCodeScore(retry),5);assert.equal(retry.scenarioAnswer,m.integratedScenario.answer)
})
test('all gates and explicit confirmation are required for 100%; scenario retry invalidates completion',()=>{
 const p=ready();assert.equal(m.canCompleteIntegrated(p),true);assert.equal(m.integratedProgressPercent(p),91);assert.equal(m.integratedProgressPercent(m.normalizeIntegratedProgress({...p,completed:true})),100)
 const cases=[...m.integratedReadings.map(r=>({read:p.read.filter(x=>x!==r.id)})),...m.missions.map(r=>({solved:p.solved.filter(x=>x!==r.id)})),{code:{}},{answers:{}},{scenarioAnswer:0},{scenarioAnswer:undefined}]
 for(const patch of cases){const bad=m.normalizeIntegratedProgress({...p,completed:true,...patch});assert.equal(bad.completed,false);assert.equal(m.canCompleteIntegrated(bad),false);assert.ok(m.integratedProgressPercent(bad)<100)}
 for(const answer of [0,2])assert.equal(m.canCompleteIntegrated({...p,scenarioAnswer:answer}),false)
})
test('normalization rejects malformed progress, deduplicates evidence and isolates lesson storage',()=>{
 const keys=['ftc-academy-kz:hardware:v1',storageKey,legacyStorageKey,motorStorageKey,legacyMotorStorageKey,gamepadStorageKey,legacyGamepadStorageKey,autonomousStorageKey,legacyAutonomousStorageKey,servoStorageKey,sensorStorageKey,encoderStorageKey]
 const values=new Map(keys.map((k,i)=>[k,JSON.stringify({sentinel:i,completed:true})]));const before=new Map(values)
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}})
 assert.equal(m.loadIntegratedProgress().completed,false);assert.equal(m.saveIntegratedProgress({...ready(),completed:true}),true);assert.equal(m.loadIntegratedProgress().completed,true);assert.equal(m.integratedProgressPercent(m.loadIntegratedProgress()),100)
 for(const[k,v]of before)assert.equal(values.get(k),v);assert.equal(values.size,before.size+1);assert.equal(new Set([...keys,m.integratedStorageKey]).size,keys.length+1)
 for(const value of ['{','null','[]','{"completed":true}']){values.set(m.integratedStorageKey,value);assert.equal(m.integratedProgressPercent(m.loadIntegratedProgress()),0)}
 const n=m.normalizeIntegratedProgress({read:['architecture','architecture','bad'],solved:['pickup','pickup','bad'],answers:{invalid:NaN},code:{map:'fly'},scenarioAnswer:100,completed:true});assert.deepEqual(n.read,['architecture']);assert.deepEqual(n.solved,['pickup']);assert.equal(n.completed,false);assert.deepEqual(n.answers,{})
})
test('storage failure returns usable empty progress and reports failed persistence',()=>{
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('blocked')}});assert.equal(m.loadIntegratedProgress().completed,false);assert.equal(m.saveIntegratedProgress(ready()),false)
})
