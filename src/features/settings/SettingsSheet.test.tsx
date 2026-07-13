import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/store'
import { SettingsSheet } from './SettingsSheet'

function reset() {
  useStore.getState().resetAll()
}

describe('SettingsSheet', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('renders all sections when open', () => {
    render(<SettingsSheet open onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Units')).toBeInTheDocument()
    expect(screen.getByText('Week starts on')).toBeInTheDocument()
    expect(screen.getByText('6 sessions — Push, Pull, Legs, twice each')).toBeInTheDocument()
    expect(screen.getByText('Rest timer')).toBeInTheDocument()
    expect(screen.getByText('Export JSON')).toBeInTheDocument()
    expect(screen.getByText('Workout v1 — your data never leaves this device.')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<SettingsSheet open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('switching unit updates the store', () => {
    render(<SettingsSheet open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'lb' }))
    expect(useStore.getState().settings.unit).toBe('lb')
  })

  it('switching week start updates the store', () => {
    render(<SettingsSheet open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sunday' }))
    expect(useStore.getState().settings.weekStartsOn).toBe(0)
  })

  it('switching rest timer updates the store', () => {
    render(<SettingsSheet open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Off' }))
    expect(useStore.getState().settings.restSeconds).toBe(0)
  })

  it('reset requires double confirmation and clears data', () => {
    useStore.getState().startSession('push')
    useStore.getState().finishSession()
    expect(useStore.getState().sessions).toHaveLength(1)

    const onClose = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsSheet open onClose={onClose} />)
    fireEvent.click(screen.getByText('Reset everything'))

    expect(confirmSpy).toHaveBeenCalledTimes(2)
    expect(useStore.getState().sessions).toHaveLength(0)
    expect(onClose).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('reset is aborted if the user declines either confirmation', () => {
    useStore.getState().startSession('push')
    useStore.getState().finishSession()

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<SettingsSheet open onClose={() => {}} />)
    fireEvent.click(screen.getByText('Reset everything'))

    expect(useStore.getState().sessions).toHaveLength(1)
    confirmSpy.mockRestore()
  })
})
