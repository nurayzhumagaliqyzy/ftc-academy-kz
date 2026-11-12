export const programmingLessons = [
  { id: 'sdk-opmode', title: 'FTC SDK және OpMode негіздері', hash: 'programming/sdk-opmode' },
  { id: 'dc-motor', title: 'DC Motor басқару', hash: 'programming/dc-motor' },
  { id: 'gamepad-teleop', title: 'Gamepad және TeleOp', hash: 'programming/gamepad-teleop' },
  { id: 'autonomous', title: 'Autonomous негіздері', hash: 'programming/autonomous' },
] as const

export type LessonId = (typeof programmingLessons)[number]['id']
export type ProgrammingSection = LessonId | 'lessons'

export function programmingSectionFor(hash: string): ProgrammingSection | undefined {
  if (hash === 'programming/lessons') return 'lessons'
  return programmingLessons.find(lesson => lesson.hash === hash)?.id
}
