import type { WeekVolume } from '../../lib/stats'
import { formatDate } from '../../lib/dates'
import { niceMax, scaleLinear } from './chart'

const VW = 358
const VH = 168
const VPAD = { top: 28, right: 8, bottom: 22, left: 8 }

/** parse a local 'YYYY-MM-DD' week-start key back into a Date (no UTC shift) */
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function WeeklyVolumeCard({ weeks }: { weeks: WeekVolume[] }) {
  const hasData = weeks.some((w) => w.volume > 0)
  const maxVol = niceMax(Math.max(1, ...weeks.map((w) => w.volume)))
  const y = scaleLinear([0, maxVol], [VH - VPAD.bottom, VPAD.top])
  const base = VH - VPAD.bottom
  const n = weeks.length
  const slot = (VW - VPAD.left - VPAD.right) / n
  const barW = Math.min(28, slot * 0.6)
  const maxIndex = weeks.reduce((bi, w, i) => (w.volume > weeks[bi].volume ? i : bi), 0)
  const currentIndex = n - 1

  return (
    <div className="card">
      <p className="label prog-section-label">Weekly volume</p>
      {!hasData ? (
        <p className="micro" style={{ marginTop: 8 }}>
          Volume bars fill in as you log sessions.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          height={VH}
          role="img"
          aria-label={`Weekly training volume, last ${n} weeks`}
        >
          {weeks.map((w, i) => {
            const cx = VPAD.left + slot * (i + 0.5)
            const py = y(w.volume)
            const isMax = i === maxIndex && w.volume > 0
            const isCurrent = i === currentIndex
            return (
              <g key={w.weekStart}>
                <rect
                  x={cx - barW / 2}
                  y={py}
                  width={barW}
                  height={Math.max(0, base - py)}
                  rx={4}
                  fill={isCurrent ? 'var(--gold)' : 'var(--surface-2)'}
                />
                {(isMax || isCurrent) && w.volume > 0 && (
                  <text x={cx} y={py - 6} textAnchor="middle" className="prog-axis-label">
                    {Math.round(w.volume)}
                  </text>
                )}
              </g>
            )
          })}
          <text x={VPAD.left} y={VH - 4} textAnchor="start" className="prog-axis-label">
            {formatDate(parseYmd(weeks[0].weekStart).getTime())}
          </text>
          <text x={VW - VPAD.right} y={VH - 4} textAnchor="end" className="prog-axis-label">
            {formatDate(parseYmd(weeks[n - 1].weekStart).getTime())}
          </text>
        </svg>
      )}
    </div>
  )
}
