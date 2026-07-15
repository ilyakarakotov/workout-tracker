import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/store'
import { SettingsSheet } from './SettingsSheet'

function reset() {
  useStore.getState().resetAll()
}

/** Minimal stand-in for the global `Notification` constructor + statics. */
class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn(async () => MockNotification.permission)
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

describe('SettingsSheet — rest alerts, unsupported (no Notification API, e.g. jsdom default)', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('renders a disabled-looking row with "Not supported on this device."', () => {
    render(<SettingsSheet open onClose={() => {}} />)
    expect(screen.getByText('Rest alerts')).toBeInTheDocument()
    expect(screen.getByText('Not supported on this device.')).toBeInTheDocument()
    // no interactive Segmented control is rendered for this row
    expect(screen.queryByRole('group', { name: 'Rest alerts' })).not.toBeInTheDocument()
  })
})

describe('SettingsSheet — rest alerts, with a mocked Notification API', () => {
  beforeEach(() => {
    reset()
    MockNotification.permission = 'default'
    MockNotification.requestPermission = vi.fn(async () => MockNotification.permission)
    vi.stubGlobal('Notification', MockNotification)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders the On/Off toggle and helper copy', () => {
    render(<SettingsSheet open onClose={() => {}} />)
    const group = screen.getByRole('group', { name: 'Rest alerts' })
    expect(group).toBeInTheDocument()
    expect(
      screen.getByText('Notifies you when rest ends, if the app is in the background.'),
    ).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Off' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('enabling requests permission and flips the store setting when granted', async () => {
    MockNotification.permission = 'granted'
    render(<SettingsSheet open onClose={() => {}} />)
    const group = screen.getByRole('group', { name: 'Rest alerts' })

    fireEvent.click(within(group).getByRole('button', { name: 'On' }))

    await waitFor(() => expect(useStore.getState().settings.restAlerts).toBe(true))
    expect(MockNotification.requestPermission).toHaveBeenCalled()
    expect(screen.queryByText('Notifications are blocked for this app.')).not.toBeInTheDocument()
  })

  it('reverts the toggle and shows a calm inline note when permission is denied', async () => {
    MockNotification.permission = 'denied'
    render(<SettingsSheet open onClose={() => {}} />)
    const group = screen.getByRole('group', { name: 'Rest alerts' })

    fireEvent.click(within(group).getByRole('button', { name: 'On' }))

    await waitFor(() =>
      expect(screen.getByText('Notifications are blocked for this app.')).toBeInTheDocument(),
    )
    expect(useStore.getState().settings.restAlerts).toBe(false)
    expect(within(group).getByRole('button', { name: 'Off' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('turning it back off clears the setting and any blocked note', async () => {
    MockNotification.permission = 'granted'
    render(<SettingsSheet open onClose={() => {}} />)
    const group = screen.getByRole('group', { name: 'Rest alerts' })

    fireEvent.click(within(group).getByRole('button', { name: 'On' }))
    await waitFor(() => expect(useStore.getState().settings.restAlerts).toBe(true))

    fireEvent.click(within(group).getByRole('button', { name: 'Off' }))
    expect(useStore.getState().settings.restAlerts).toBe(false)
  })
})
