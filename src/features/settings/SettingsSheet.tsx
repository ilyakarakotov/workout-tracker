import { useRef, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { useStore } from '../../store/store'
import type { Unit } from '../../lib/types'
import { Segmented } from './Segmented'
import './SettingsSheet.css'

const REST_OPTIONS = [0, 30, 60, 90, 120, 180]

function restLabel(s: number): string {
  return s === 0 ? 'Off' : `${s}s`
}

/** Settings sheet — units, week start, rest timer, data export/import/reset. */
export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `forge-export-${date}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (file: File) => {
    if (!confirm('This replaces all current data.')) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importData(String(reader.result ?? ''))
      setImportMsg(
        result.ok ? { ok: true, text: 'Import complete.' } : { ok: false, text: result.error },
      )
    }
    reader.onerror = () => setImportMsg({ ok: false, text: 'Could not read that file.' })
    reader.readAsText(file)
  }

  const handleReset = () => {
    if (!confirm('Reset all data — templates, history, and settings?')) return
    if (!confirm('This cannot be undone. Reset everything?')) return
    resetAll()
    setImportMsg(null)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <section className="settings-section">
        <p className="label">Units</p>
        <Segmented<Unit>
          ariaLabel="Units"
          value={settings.unit}
          onChange={(unit) => updateSettings({ unit })}
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
        />
        <p className="micro">Existing numbers are not converted.</p>
      </section>

      <section className="settings-section">
        <p className="label">Week starts on</p>
        <Segmented<0 | 1>
          ariaLabel="Week starts on"
          value={settings.weekStartsOn}
          onChange={(weekStartsOn) => updateSettings({ weekStartsOn })}
          options={[
            { value: 1, label: 'Monday' },
            { value: 0, label: 'Sunday' },
          ]}
        />
      </section>

      <section className="settings-section">
        <p className="label">Weekly goal</p>
        <div className="settings-static">6 sessions — Push, Pull, Legs, twice each</div>
      </section>

      <section className="settings-section">
        <p className="label">Rest timer</p>
        <Segmented<number>
          ariaLabel="Rest timer duration"
          value={settings.restSeconds}
          onChange={(restSeconds) => updateSettings({ restSeconds })}
          options={REST_OPTIONS.map((s) => ({ value: s, label: restLabel(s) }))}
        />
      </section>

      <section className="settings-section">
        <p className="label">Data</p>
        <div className="settings-datarow">
          <button type="button" className="btn-ghost" onClick={handleExport}>
            Export JSON
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Import JSON file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImportFile(file)
            e.target.value = ''
          }}
        />
        {importMsg ? (
          <p className={`micro ${importMsg.ok ? 'settings-ok' : 'settings-error'}`} role="status">
            {importMsg.text}
          </p>
        ) : null}
        <button type="button" className="btn-danger" onClick={handleReset}>
          Reset everything
        </button>
      </section>

      <p className="micro settings-footer">Forge v1 — your data never leaves this device.</p>
    </Sheet>
  )
}
