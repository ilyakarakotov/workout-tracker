import { useEffect, useMemo, useState } from 'react'
import type { Exercise, Session, Unit } from '../../lib/types'
import type { ExercisePoint } from '../../lib/stats'
import { exerciseSeries, prMap } from '../../lib/stats'
import { formatDate } from '../../lib/dates'
import { areaPath, linePath, niceMax, scaleLinear, ticks } from './chart'

const ACCENT: Record<string, string> = {
  push: 'var(--push)',
  pull: 'var(--pull)',
  legs: 'var(--legs)',
}

const CHART_W = 358
const CHART_H = 176
const PAD = { top: 16, right: 12, bottom: 26, left: 40 }
const VOL_W = 358
const VOL_H = 56
const VOL_PAD = { top: 6, right: 12, bottom: 4, left: 40 }

export interface ExerciseTrendProps {
  sessions: Session[]
  exercises: Record<string, Exercise>
  unit: Unit
}

interface Candidate {
  id: string
  name: string
  points: ExercisePoint[]
}

export function ExerciseTrend({ sessions, exercises, unit }: ExerciseTrendProps) {
  const candidates = useMemo<Candidate[]>(() => {
    const map = prMap(sessions)
    return [...map.values()]
      .map((pr) => ({ id: pr.exerciseId, name: pr.name, points: exerciseSeries(sessions, pr.exerciseId) }))
      .filter((c) => c.points.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [sessions])

  const defaultId = useMemo(() => {
    if (candidates.length === 0) return ''
    return candidates.reduce((best, c) => (c.points.length > best.points.length ? c : best)).id
  }, [candidates])

  const [selected, setSelected] = useState(defaultId)

  useEffect(() => {
    if (!candidates.some((c) => c.id === selected)) setSelected(defaultId)
  }, [candidates, defaultId, selected])

  if (candidates.length === 0) {
    return (
      <div className="card">
        <p className="label">Exercise trend</p>
        <p className="micro" style={{ marginTop: 8 }}>
          Log a session to start tracking a trend.
        </p>
      </div>
    )
  }

  const active = candidates.find((c) => c.id === selected) ?? candidates[0]
  const accent = ACCENT[exercises[active.id]?.dayType ?? ''] ?? 'var(--gold)'
  const points = active.points

  return (
    <div className="card">
      <div className="prog-trend-head">
        <p className="label">Exercise trend</p>
        <select
          className="prog-picker"
          value={active.id}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Exercise"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {points.length < 2 ? (
        <p className="micro prog-trend-empty">log this lift once more to see a trend</p>
      ) : (
        <>
          <LineChart points={points} accent={accent} unit={unit} />
          <VolumeMiniChart points={points} accent={accent} />
        </>
      )}
    </div>
  )
}

function LineChart({ points, accent, unit }: { points: ExercisePoint[]; accent: string; unit: Unit }) {
  const minAt = points[0].at
  const maxAt = points[points.length - 1].at
  const maxE1rm = niceMax(Math.max(...points.map((p) => p.bestE1rm)))
  const x = scaleLinear([minAt, maxAt], [PAD.left, CHART_W - PAD.right])
  const y = scaleLinear([0, maxE1rm], [CHART_H - PAD.bottom, PAD.top])
  const svgPoints = points.map((p) => ({ x: x(p.at), y: y(p.bestE1rm) }))
  const gridTicks = ticks(0, maxE1rm, 4)
  const last = points[points.length - 1]
  const lastXY = svgPoints[svgPoints.length - 1]
  const lastLabelAnchor = lastXY.x > CHART_W - PAD.right - 24 ? 'end' : 'middle'

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      width="100%"
      height={CHART_H}
      className="prog-linechart"
      role="img"
      aria-label={`${last.bestE1rm.toFixed(1)} ${unit} estimated one-rep max, latest of ${points.length} sessions`}
    >
      {gridTicks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={CHART_W - PAD.right} y1={y(t)} y2={y(t)} className="prog-grid" />
          <text x={PAD.left - 8} y={y(t)} className="prog-axis-label" textAnchor="end" dominantBaseline="middle">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path d={areaPath(svgPoints, CHART_H - PAD.bottom)} fill={accent} opacity={0.1} stroke="none" />
      <path
        d={linePath(svgPoints)}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {svgPoints.map((p, i) => (
        <circle
          key={points[i].sessionId}
          cx={p.x}
          cy={p.y}
          r={i === svgPoints.length - 1 ? 4 : 2.5}
          fill={i === svgPoints.length - 1 ? accent : 'var(--surface)'}
          stroke={accent}
          strokeWidth={i === svgPoints.length - 1 ? 0 : 1.5}
        />
      ))}
      <text x={lastXY.x} y={lastXY.y - 10} textAnchor={lastLabelAnchor} className="prog-point-label">
        {last.bestE1rm.toFixed(1)}
      </text>
      <text x={PAD.left} y={CHART_H - 6} className="prog-axis-label" textAnchor="start">
        {formatDate(points[0].at)}
      </text>
      <text x={CHART_W - PAD.right} y={CHART_H - 6} className="prog-axis-label" textAnchor="end">
        {formatDate(points[points.length - 1].at)}
      </text>
    </svg>
  )
}

function VolumeMiniChart({ points, accent }: { points: ExercisePoint[]; accent: string }) {
  const minAt = points[0].at
  const maxAt = points[points.length - 1].at
  const maxVol = niceMax(Math.max(1, ...points.map((p) => p.volume)))
  const x = scaleLinear([minAt, maxAt], [VOL_PAD.left, VOL_W - VOL_PAD.right])
  const y = scaleLinear([0, maxVol], [VOL_H - VOL_PAD.bottom, VOL_PAD.top])
  const base = VOL_H - VOL_PAD.bottom
  const maxVolume = Math.max(...points.map((p) => p.volume))
  const barW = 6

  return (
    <div className="prog-vol-wrap">
      <p className="micro prog-vol-label">Volume per session</p>
      <svg
        viewBox={`0 0 ${VOL_W} ${VOL_H}`}
        width="100%"
        height={VOL_H}
        role="img"
        aria-label="Session volume for this exercise"
      >
        {points.map((p) => {
          const px = x(p.at)
          const py = y(p.volume)
          const isMax = p.volume === maxVolume && p.volume > 0
          return (
            <rect
              key={p.sessionId}
              x={px - barW / 2}
              y={py}
              width={barW}
              height={Math.max(0, base - py)}
              rx={2}
              fill={isMax ? accent : 'var(--surface-2)'}
            />
          )
        })}
      </svg>
    </div>
  )
}
