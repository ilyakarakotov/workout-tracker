import { Sheet } from '../../components/Sheet'

/**
 * STUB — executor "plan" owns this file (units, week start, rest timer,
 * export/import/reset). Opened from the Today header gear.
 */
export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <p className="micro">Settings coming soon.</p>
    </Sheet>
  )
}
