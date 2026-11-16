import { directions, field } from './model'
import type { Robot } from './model'

export function RobotField({ robot, showTrail }: { robot: Robot; showTrail: boolean }) {
  const rotation = directions.indexOf(robot.direction) * 90
  const object = robot.object
  return <svg className="rs-field" viewBox="0 0 600 600" role="img"
    aria-label={'6×6 алаң. Бастау (0,5). Робот (' + robot.position.x + ',' + robot.position.y + '), ' + robot.direction +
      '. Зат: ' + ({ ground: 'алаңда', carried: 'робот ұстап тұр', delivered: 'жеткізілді' })[object.status] +
      ' (' + object.position.x + ',' + object.position.y + '). Мақсат (5,1). Кедергілер (3,5), (3,4), (1,2), (4,2).'}>
    <defs><pattern id="rs-wall-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="16" height="16" className="rs-wall-base" /><rect width="7" height="16" className="rs-wall-stripe" />
    </pattern></defs>
    <rect width="600" height="600" className="rs-field-bg" />
    <rect x="500" y="100" width="100" height="100" className="rs-zone" />
    <circle cx="550" cy="150" r="30" className="rs-zone-ring" /><text x="550" y="159" className="rs-zone-label" textAnchor="middle">T</text>
    <rect x="4" y="504" width="92" height="92" rx="8" className="rs-start" />
    <text x="50" y="560" textAnchor="middle" className="rs-start-label">S</text>
    {Array.from({ length: 7 }, (_, i) => <g key={i} className="rs-grid-lines">
      <path d={'M' + i * 100 + ' 0V600'} /><path d={'M0 ' + i * 100 + 'H600'} />
    </g>)}
    {field.walls.map(p => <g key={p.x + ',' + p.y}>
      <rect x={p.x * 100 + 3} y={p.y * 100 + 3} width="94" height="94" rx="6" fill="url(#rs-wall-hatch)" className="rs-wall-outline" />
      <path d={'M' + (p.x * 100 + 32) + ' ' + (p.y * 100 + 32) + 'l36 36m0-36-36 36'} className="rs-wall-cross" />
    </g>)}
    {showTrail && <polyline className="rs-trail" points={robot.trail.map(p => (p.x * 100 + 50) + ',' + (p.y * 100 + 50)).join(' ')} />}
    {object.status !== 'carried' && <g transform={'translate(' + (object.position.x * 100 + 50) + ' ' + (object.position.y * 100 + 50) + ')'}>
      <path d="M0-19 19 0 0 19-19 0Z" className="rs-object" />
    </g>}
    <g transform={'translate(' + (robot.position.x * 100 + 50) + ' ' + (robot.position.y * 100 + 50) + ') rotate(' + rotation + ')'}>
      {[-32, 23].flatMap(x => [-22, 13].map(y => <rect key={x + ',' + y} x={x} y={y} width="9" height="20" rx="3" className="rs-wheel" />))}
      <rect x="-24" y="-28" width="48" height="59" rx="11" className="rs-robot-body" />
      <path d="M0-23-9-8H9Z" className="rs-direction" />
      <rect x="-14" y="-1" width="28" height="19" rx="4" className="rs-robot-hub" />
      <path d={robot.claw === 'open' ? 'M-12-27-18-38-29-44M12-27 18-38 29-44' : 'M-12-27-10-39-3-44M12-27 10-39 3-44'} className="rs-claw" />
      <rect x="-5" y="-33" width="10" height="5" rx="2" className="rs-sensor" />
      {object.status === 'carried' && <circle cx="0" cy="9" r="7" className="rs-object" />}
    </g>
  </svg>
}
