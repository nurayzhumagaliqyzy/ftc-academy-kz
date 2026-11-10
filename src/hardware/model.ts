import { hardware } from './components'
import type { ComponentId } from './components'
import { questions, scenarios } from './lessons'

export const leads = {
  motor: { label: 'DC Motor', kind: 'motor', hint: 'Қорек кабеліне Motor порты керек.' },
  encoder: { label: 'Motor Encoder', kind: 'encoder', hint: 'Айналым сигналына нөмірі сәйкес Encoder порты керек.' },
  servo: { label: 'Servo Motor', kind: 'servo', hint: 'Үш түйіспелі Servo портын таңда.' },
  distance: { label: 'REV 2m Distance Sensor', kind: 'i2c', hint: 'Бұл үлгі I2C портына жалғанады.' },
  color: { label: 'REV Color Sensor V3', kind: 'i2c', hint: 'Бұл үлгі I2C портына жалғанады.' },
  battery: { label: '12 V NiMH Battery', kind: 'power-in', hint: 'Бұл сұлбада Battery қорегі XT30 IN арқылы келеді.' },
  'expansion-power': { label: 'Expansion Hub · XT30', kind: 'power-out', hint: 'Блоктар арасындағы қорек үшін XT30 OUT таңда.' },
  'expansion-data': { label: 'Expansion Hub · RS485', kind: 'rs485', hint: 'Блоктар арасындағы дерекке RS485 портын таңда.' },
} as const

export type LeadId = keyof typeof leads
type PortKind = (typeof leads)[LeadId]['kind']
type Port = { id: string; label: string; kind: PortKind; channel?: number }
export type Connections = Partial<Record<LeadId, string>>

function numberedPorts(kind: PortKind, label: string, count: number): Port[] {
  return Array.from({ length: count }, (_, channel) => ({
    id: kind + '-' + channel, label: label + ' ' + channel, kind, channel,
  }))
}

export const portGroups: { title: string; ports: Port[] }[] = [
  { title: 'Motor', ports: numberedPorts('motor', 'Motor', 4) },
  { title: 'Encoder', ports: numberedPorts('encoder', 'Encoder', 4) },
  { title: 'Servo', ports: numberedPorts('servo', 'Servo', 6) },
  { title: 'I2C', ports: numberedPorts('i2c', 'I2C', 4) },
  { title: 'Power / RS485', ports: [
    { id: 'power-in', label: 'XT30 IN', kind: 'power-in' },
    { id: 'power-out', label: 'XT30 OUT', kind: 'power-out' },
    { id: 'rs485-1', label: 'RS485 A', kind: 'rs485' },
    { id: 'rs485-2', label: 'RS485 B', kind: 'rs485' },
  ] },
]

const ports = portGroups.flatMap(group => group.ports)
export const leadIds = Object.keys(leads) as LeadId[]

export function getPort(id: string | undefined) {
  return ports.find(port => port.id === id)
}

export function connectionError(lead: LeadId, port: Port, connections: Connections) {
  if (port.kind !== leads[lead].kind) return leads[lead].hint

  const occupant = leadIds.find(id => id !== lead && connections[id] === port.id)
  if (occupant) {
    if (port.kind === 'i2c') {
      return 'Екі REV датчигінің I2C мекенжайы бірдей. Бос I2C арнасын таңда.'
    }
    return port.label + ' бос емес. Алдымен бар қосылымды ажырат.'
  }

  const other = lead === 'motor' ? getPort(connections.encoder)
    : lead === 'encoder' ? getPort(connections.motor) : undefined
  if (other && other.channel !== port.channel) {
    return 'Осы DC Motor үшін Motor мен Encoder нөмірлері сәйкес болуы керек. ' +
      other.label + ' қосылып тұр. Сәйкес нөмірді таңда немесе алдыңғы қосылымды ажырат.'
  }
}

export type Progress = {
  explored: ComponentId[]
  wiring: Connections
  quiz: Record<string, number>
  diagnoses: Record<string, number[]>
}

const storageKey = 'ftc-academy-kz:hardware:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isOption(value: unknown, length: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length
}

export function normalizeProgress(value: unknown): Progress {
  const progress: Progress = { explored: [], wiring: {}, quiz: {}, diagnoses: {} }
  if (!isRecord(value)) return progress

  const explored = value.explored
  if (Array.isArray(explored)) {
    progress.explored = hardware.filter(item => explored.includes(item.id)).map(item => item.id)
  }
  if (isRecord(value.wiring)) {
    for (const lead of leadIds) {
      const id = value.wiring[lead]
      const port = typeof id === 'string' ? getPort(id) : undefined
      if (port && !connectionError(lead, port, progress.wiring)) progress.wiring[lead] = port.id
    }
  }
  if (isRecord(value.quiz)) {
    for (const question of questions) {
      const answer = value.quiz[question.id]
      if (isOption(answer, question.options.length)) progress.quiz[question.id] = answer
    }
  }
  if (isRecord(value.diagnoses)) {
    for (const scenario of scenarios) {
      const choices = value.diagnoses[scenario.id]
      if (Array.isArray(choices)) {
        const valid = [...new Set(choices.filter(choice => isOption(choice, scenario.choices.length)))]
        if (valid.length > 0) progress.diagnoses[scenario.id] = valid
      }
    }
  }
  return progress
}

export function loadProgress() {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(storageKey) ?? 'null'))
  } catch {
    return normalizeProgress(null)
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function quizScore(answers: Progress['quiz']) {
  return questions.filter(question => answers[question.id] === question.answer).length
}

export function diagnosisMatches(choices: readonly { plausible: boolean }[], selected: readonly number[]) {
  return choices.every((choice, index) => choice.plausible === selected.includes(index))
}
