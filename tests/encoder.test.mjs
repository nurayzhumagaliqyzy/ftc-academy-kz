import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  parseTickInput, ticksPerStep, initialEncoderState, encoderCurrent, encoderRemaining, encoderDirection, encoderAngle,
  advanceEncoder, startEncoder, pauseEncoder, stepEncoder, resetEncoderReference, setEncoderTarget, encoderLabCode,
  encoderChallenges, evaluateEncoderChallenge, encoderCodeTasks, encoderCodeScore, encoderQuestions, encoderQuizPassed,
  encoderQuizScore, encoderReadings, encoderScenario, canCompleteEncoder, encoderProgressPercent,
  normalizeEncoderProgress, loadEncoderProgress, saveEncoderProgress, encoderStorageKey,
} from '../src/programming/encoderModel.ts'
import { programmingLessons, programmingSectionFor } from '../src/programming/routes.ts'
import { storageKey, legacyStorageKey } from '../src/programming/model.ts'
import { motorStorageKey, legacyMotorStorageKey } from '../src/programming/motorModel.ts'
import { gamepadStorageKey, legacyGamepadStorageKey } from '../src/programming/gamepadModel.ts'
import { autonomousStorageKey, legacyAutonomousStorageKey } from '../src/programming/autonomousModel.ts'
import { servoStorageKey } from '../src/programming/servoModel.ts'
import { sensorStorageKey } from '../src/programming/sensorModel.ts'

const descriptor = Object.getOwnPropertyDescriptor(globalThis,'localStorage')
afterEach(() => { if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else delete globalThis.localStorage })
function run(state) {
  state=startEncoder(state)
  for(let i=0;state.status==='running'&&i<100;i++) state=advanceEncoder(state)
  return state
}
function ready() {
  return normalizeEncoderProgress({ read:encoderReadings.map(x=>x.id), solved:encoderChallenges.map(x=>x.id), code:Object.fromEntries(encoderCodeTasks.map(x=>[x.id,x.answer])), answers:Object.fromEntries(encoderQuestions.map(x=>[x.id,x.answer])), scenarioAnswer:encoderScenario.answer })
}
function mockStorage(values) { Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}}) }
test('seven unique routes retain the first six hashes; final-project links remain absent',()=>{
  assert.deepEqual(programmingLessons.map(x=>programmingSectionFor(x.hash)),['sdk-opmode','dc-motor','gamepad-teleop','autonomous','servo','sensors','encoder'])
  assert.equal(new Set(programmingLessons.map(x=>x.hash)).size,7)
  for(const hash of ['programming/8','programming/integrated-challenge','programming/encoder/other']) assert.equal(programmingSectionFor(hash),undefined)
})
test('tick inputs accept signed bounded integers; blanks, fractions and non-finite values are rejected',()=>{
  for(const [input,value] of [['+600',600],['-400',-400],[' -2000 ',-2000],[2000,2000],['0',0],[-0,0]]) assert.equal(parseTickInput(input),value)
  for(const input of ['', ' ', '1.5', '1e3', 1.5, 2001, -2001, Infinity, NaN, undefined, null, {}, '12tick']) assert.equal(parseTickInput(input),undefined)
  assert.equal(parseTickInput('-4000',4000),-4000)
  assert.throws(()=>initialEncoderState(NaN,800),RangeError)
})
test('remaining ticks and conceptual direction are signed target minus current',()=>{
  for(const [current,target,difference,direction] of [[200,800,600,'increase'],[500,100,-400,'decrease'],[-200,100,300,'increase'],[100,-200,-300,'decrease'],[-800,-200,600,'increase'],[-200,-800,-600,'decrease'],[-100,-100,0,'reached']]) {
    const state=initialEncoderState(current,target)
    assert.equal(encoderRemaining(state),difference);assert.equal(encoderDirection(state),direction)
  }
})
test('each movement step is deterministic, at most 60 ticks and never overshoots signed targets',()=>{
  assert.equal(ticksPerStep,60)
  for(const [current,target] of [[200,800],[500,100],[-300,300],[100,-85],[-2000,2000],[2000,-2000],[0,-1],[0,1]]) {
    let state=startEncoder(initialEncoderState(current,target));let previous=current
    while(state.status==='running') {
      const next=advanceEncoder(state),count=encoderCurrent(next)
      assert.ok(Math.abs(count-previous)<=60)
      assert.ok(Math.abs(target-count)<Math.abs(target-previous))
      assert.ok(count>=Math.min(current,target)&&count<=Math.max(current,target))
      state=next;previous=count
    }
    assert.equal(encoderCurrent(state),target);assert.equal(state.status,'reached')
    assert.equal(state.steps,Math.ceil(Math.abs(target-current)/60))
    assert.deepEqual(state,run(initialEncoderState(current,target)))
  }
})
test('already-reached targets stay still and do not count phantom steps',()=>{
  const state=initialEncoderState(-100,-100)
  for(const result of [startEncoder(state),advanceEncoder(state),stepEncoder(state),run(state)]) {
    assert.equal(result.status,'reached');assert.equal(result.steps,0);assert.equal(result.shaftTicks,-100)
  }
})
test('pause is inert; resume preserves cursor/start count; single-step pauses after one fixed advance',()=>{
  const initial=initialEncoderState();assert.strictEqual(advanceEncoder(initial),initial)
  const once=advanceEncoder(startEncoder(initial));assert.equal(encoderCurrent(once),260)
  const paused=pauseEncoder(once);assert.equal(paused.status,'paused');assert.strictEqual(advanceEncoder(paused),paused)
  const twice=advanceEncoder(startEncoder(paused));assert.equal(encoderCurrent(twice),320);assert.equal(twice.steps,2);assert.equal(twice.startCount,200)
  const single=stepEncoder(initial);assert.equal(single.status,'paused');assert.equal(encoderCurrent(single),260);assert.equal(single.steps,1)
  assert.equal(run(single).steps,10)
})
test('reference reset preserves shaft coordinate and visual angle, zeros current and cancels old target',()=>{
  const moving=advanceEncoder(startEncoder(initialEncoderState(500,100)))
  const angle=encoderAngle(moving),shaft=moving.shaftTicks
  const reset=resetEncoderReference(moving)
  assert.equal(reset.shaftTicks,shaft);assert.equal(encoderAngle(reset),angle)
  assert.equal(encoderCurrent(reset),0);assert.equal(reset.zeroOffset,shaft);assert.equal(reset.target,0)
  assert.equal(reset.resetCount,1);assert.equal(reset.status,'reached');assert.equal(reset.steps,0)
  const relative=run(setEncoderTarget(reset,360))
  assert.equal(relative.shaftTicks,shaft+360);assert.equal(encoderCurrent(relative),360)
  assert.notEqual(encoderAngle(relative),angle)
  const twice=resetEncoderReference(relative);assert.equal(twice.resetCount,2);assert.equal(twice.shaftTicks,relative.shaftTicks);assert.equal(encoderCurrent(twice),0)
})
test('target edits preserve shaft and reference, reject invalid/running edits and use the current count as new start',()=>{
  const state=pauseEncoder(advanceEncoder(startEncoder(initialEncoderState())))
  const changed=setEncoderTarget(state,-200)
  assert.equal(changed.shaftTicks,state.shaftTicks);assert.equal(changed.zeroOffset,state.zeroOffset);assert.equal(changed.startCount,260);assert.equal(changed.steps,0)
  assert.equal(run(changed).target,-200)
  for(const input of ['',NaN,2001]) assert.strictEqual(setEncoderTarget(state,input),state)
  const running=startEncoder(state);assert.strictEqual(setEncoderTarget(running,-200),running)
  const equal=setEncoderTarget(state,260);assert.equal(equal.status,'reached')
})
test('live Java keeps target before RUN_TO_POSITION and uses nonnegative power for decreasing motion',()=>{
  const state=startEncoder(initialEncoderState(500,100))
  const code=encoderLabCode(state)
  assert.ok(code.indexOf('setTargetPosition(100)')<code.indexOf('setMode(DcMotor.RunMode.RUN_TO_POSITION)'))
  assert.ok(code.includes('setPower(0.4)'));assert.ok(code.includes('remaining = -400'))
  assert.ok(encoderLabCode(pauseEncoder(state)).includes('setPower(0)'))
})
test('three challenges require movement, correct initial difference and distinct correct explanations',()=>{
  for(const item of encoderChallenges) {
    let state=item.id==='reference'?setEncoderTarget(resetEncoderReference(initialEncoderState(500,500)),360):initialEncoderState(item.current,item.target)
    assert.equal(evaluateEncoderChallenge(item.id,state,item.difference,item.answer).correct,false)
    state=run(state)
    assert.equal(evaluateEncoderChallenge(item.id,state,String(item.difference),item.answer).correct,true)
    assert.equal(evaluateEncoderChallenge(item.id,state,item.difference+1,item.answer).correct,false)
    for(let answer=0;answer<item.options.length;answer++) if(answer!==item.answer) assert.equal(evaluateEncoderChallenge(item.id,state,item.difference,answer).correct,false)
    assert.equal(evaluateEncoderChallenge(item.id,state,'',item.answer).correct,false)
  }
  assert.equal(evaluateEncoderChallenge('reference',run(initialEncoderState(0,360)),360,2).correct,false)
  assert.equal(evaluateEncoderChallenge('positive',run(initialEncoderState(0,800)),600,0).correct,false)
  assert.equal(evaluateEncoderChallenge('unknown',run(initialEncoderState()),600,0).correct,false)
})
test('reset diagnostic changes the target coordinate but preserves the intended physical displacement',()=>{
  const before=initialEncoderState(500,800),expectedEnd=run(before).shaftTicks
  const reset=resetEncoderReference(before)
  const correct=run(setEncoderTarget(reset,300)),wrong=run(setEncoderTarget(reset,800))
  assert.equal(correct.shaftTicks,expectedEnd);assert.equal(wrong.shaftTicks,1300)
  assert.equal(encoderScenario.answer,2)
})
test('all five Java tasks must be correct; quiz requires all answers with >=4/5 and a separate correct scenario',()=>{
  const progress=ready();assert.equal(encoderCodeScore(progress),5)
  for(const task of encoderCodeTasks) {
    const wrong=task.options.find(x=>x!==task.answer)
    assert.equal(encoderCodeScore({...progress,code:{...progress.code,[task.id]:wrong}}),4)
    assert.equal(canCompleteEncoder({...progress,code:{...progress.code,[task.id]:wrong}}),false)
  }
  delete progress.answers.ticks
  assert.equal(encoderQuizScore(progress),4);assert.equal(encoderQuizPassed(progress),false)
  progress.answers.ticks=1;assert.equal(encoderQuizPassed(progress),true)
  assert.equal(canCompleteEncoder({...progress,scenarioAnswer:undefined}),false)
  assert.equal(canCompleteEncoder({...progress,scenarioAnswer:0}),false)
  progress.answers.cpr=0;assert.equal(encoderQuizScore(progress),3);assert.equal(encoderQuizPassed(progress),false)
})
test('all completion gates are required; explicit completion alone takes 91% to 100%',()=>{
  const progress=ready();assert.equal(canCompleteEncoder(progress),true);assert.equal(encoderProgressPercent(progress),91)
  assert.equal(encoderProgressPercent(normalizeEncoderProgress({...progress,completed:true})),100)
  for(const change of [
    ...encoderReadings.map(item=>({read:progress.read.filter(id=>id!==item.id)})),
    ...encoderChallenges.map(item=>({solved:progress.solved.filter(id=>id!==item.id)})),
    {code:{}},{answers:{}},{scenarioAnswer:undefined},
  ]) {
    const result=normalizeEncoderProgress({...progress,...change,completed:true})
    assert.equal(result.completed,false);assert.equal(canCompleteEncoder(result),false)
  }
})
test('normalization filters invalid data, deduplicates evidence and refuses unsupported completion',()=>{
  const result=normalizeEncoderProgress({read:['ticks','ticks','bad'],solved:['positive','positive','bad'],code:{current:'getPower',target:'bad'},answers:{ticks:0,cpr:99,reset:'1',power:.5},scenarioAnswer:99,completed:true})
  assert.deepEqual(result,{assessmentVersion:1,previouslyCompleted:false,read:['ticks'],solved:['positive'],code:{current:'getPower'},answers:{ticks:0},completed:false})
  for(const value of [null,[],4,'bad',{completed:true}]) assert.equal(encoderProgressPercent(normalizeEncoderProgress(value)),0)
})
test('partial/full persistence and retries leave all six lesson keys, old migration backups and Hardware untouched',()=>{
  const keys=[storageKey,legacyStorageKey,motorStorageKey,legacyMotorStorageKey,gamepadStorageKey,legacyGamepadStorageKey,autonomousStorageKey,legacyAutonomousStorageKey,servoStorageKey,sensorStorageKey,'ftc-academy-kz:hardware:v1']
  const values=new Map(keys.map(key=>[key,`existing:${key}`])),before=new Map(values);mockStorage(values)
  saveEncoderProgress({...loadEncoderProgress(),solved:['positive','positive']});assert.deepEqual(loadEncoderProgress().solved,['positive'])
  saveEncoderProgress({...ready(),completed:true});const complete=loadEncoderProgress();assert.equal(complete.completed,true)
  for(const change of [{solved:[]},{answers:{}},{scenarioAnswer:undefined}]) {
    saveEncoderProgress({...complete,...change,completed:false});const result=loadEncoderProgress()
    assert.equal(result.completed,false);assert.deepEqual(result.read,complete.read);assert.deepEqual(result.code,complete.code)
    if(!('solved'in change))assert.deepEqual(result.solved,complete.solved)
    if(!('answers'in change))assert.deepEqual(result.answers,complete.answers)
    if(!('scenarioAnswer'in change))assert.equal(result.scenarioAnswer,complete.scenarioAnswer)
  }
  for(const[key,value]of before)assert.equal(values.get(key),value)
  assert.equal(values.size,before.size+1);assert.equal(new Set([...keys,encoderStorageKey]).size,keys.length+1)
})
test('corrupt/blocked storage and quota errors leave the lesson usable without resetting earlier keys',()=>{
  const values=new Map();mockStorage(values)
  for(const text of [undefined,'{broken','null','[]','4']) {
    if(text===undefined)values.delete(encoderStorageKey);else values.set(encoderStorageKey,text)
    assert.equal(encoderProgressPercent(loadEncoderProgress()),0)
  }
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('Blocked')}})
  assert.equal(encoderProgressPercent(loadEncoderProgress()),0);assert.equal(saveEncoderProgress(ready()),false)
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem(){throw Error('Quota')}}})
  assert.equal(saveEncoderProgress(ready()),false)
})
