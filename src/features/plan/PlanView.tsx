import { useState } from 'react'
import type { DayType } from '../../lib/types'
import { DAY_TYPES } from '../../lib/types'
import { TemplateCard } from './TemplateCard'
import { LibrarySheet } from './LibrarySheet'
import './PlanView.css'

export function PlanView() {
  const [expanded, setExpanded] = useState<DayType | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)

  return (
    <div className="view">
      <header>
        <h1 className="title">Plan</h1>
        <p className="micro">Push / Pull / Legs — each twice a week.</p>
      </header>

      <div className="plan-list">
        {DAY_TYPES.map((dt) => (
          <TemplateCard
            key={dt}
            dayType={dt}
            expanded={expanded === dt}
            onToggle={() => setExpanded((cur) => (cur === dt ? null : dt))}
          />
        ))}
      </div>

      <button type="button" className="btn-ghost" onClick={() => setLibraryOpen(true)}>
        Manage library
      </button>

      <LibrarySheet open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  )
}
