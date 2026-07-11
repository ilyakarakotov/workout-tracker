import type { DayType } from '../lib/types'
import { DAY_TYPE_LABEL } from '../lib/types'
import './DayTypeBadge.css'

export function DayTypeBadge({ dayType, size = 'md' }: { dayType: DayType; size?: 'sm' | 'md' }) {
  return (
    <span className={`dtb dtb-${dayType} dtb-${size}`}>{DAY_TYPE_LABEL[dayType].toUpperCase()}</span>
  )
}
