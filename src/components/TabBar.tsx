import type { ViewId } from '../lib/views'
import './TabBar.css'

const ICONS: Record<ViewId, JSX.Element> = {
  today: (
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="currentColor" />
  ),
  history: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17M8 2.8v4M16 2.8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8.5" cy="14" r="1.4" fill="currentColor" />
      <circle cx="12" cy="14" r="1.4" fill="currentColor" />
      <circle cx="15.5" cy="17.5" r="1.4" fill="currentColor" />
    </>
  ),
  progress: (
    <path
      d="M4 19.5 9 13l3.5 3L20 6.5M20 6.5h-4.5M20 6.5V11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  plan: (
    <>
      <path d="M8 6.5h12M8 12h12M8 17.5h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4.2" cy="6.5" r="1.5" fill="currentColor" />
      <circle cx="4.2" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4.2" cy="17.5" r="1.5" fill="currentColor" />
    </>
  ),
}

const LABELS: Record<ViewId, string> = {
  today: 'Today',
  history: 'History',
  progress: 'Progress',
  plan: 'Plan',
}

const ORDER: ViewId[] = ['today', 'history', 'progress', 'plan']

export function TabBar({ active, onChange }: { active: ViewId; onChange: (v: ViewId) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={`tab${active === id ? ' tab-active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            {ICONS[id]}
          </svg>
          <span>{LABELS[id]}</span>
        </button>
      ))}
    </nav>
  )
}
