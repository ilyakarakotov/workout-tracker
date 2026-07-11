import './StreakFlame.css'

export function StreakFlame({ count }: { count: number }) {
  const lit = count > 0
  return (
    <div
      className={`flame${lit ? ' flame-lit' : ''}`}
      role="img"
      aria-label={
        lit
          ? `${count} perfect week streak`
          : 'No streak yet — hit 6 sessions in a week to start one'
      }
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 2c.6 3.2-.7 4.9-2.3 6.6C8 10.4 6.5 12 6.5 14.7a5.5 5.5 0 0 0 11 0c0-1.6-.6-2.9-1.4-4-.3 1-.9 1.8-1.8 2.3.3-2.9-.8-6.4-2.3-8.2A9.5 9.5 0 0 0 12 2Z"
          fill="currentColor"
        />
      </svg>
      <span className="num flame-count">{count}</span>
      <span className="micro">wk streak</span>
    </div>
  )
}
