import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canNotify,
  clearWorkoutBadge,
  notificationPermission,
  notifyRestDone,
  requestNotifyPermission,
  setWorkoutBadge,
  stageIconSvg,
  stageIconUrl,
} from './notify'

/** Minimal stand-in for the global `Notification` constructor + statics. */
class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn(async () => MockNotification.permission)
  static instances: MockNotification[] = []
  title: string
  options?: NotificationOptions
  constructor(title: string, options?: NotificationOptions) {
    this.title = title
    this.options = options
    MockNotification.instances.push(this)
  }
}

describe('stageIconSvg — pure', () => {
  it('embeds the push/pull/legs accent hex for each day type', () => {
    expect(stageIconSvg('push', 'lift')).toContain('#ff6b57')
    expect(stageIconSvg('pull', 'lift')).toContain('#4da3ff')
    expect(stageIconSvg('legs', 'lift')).toContain('#8fe388')
  })

  it('falls back to a neutral accent when dayType is null', () => {
    const svg = stageIconSvg(null, 'lift')
    expect(svg).not.toContain('#ff6b57')
    expect(svg).not.toContain('#4da3ff')
    expect(svg).not.toContain('#8fe388')
    expect(svg).toContain('#5e6470')
  })

  it('renders a visually distinct glyph per kind', () => {
    const lift = stageIconSvg('push', 'lift')
    const rest = stageIconSvg('push', 'rest')
    expect(lift).not.toBe(rest)
    expect(lift).toContain('data-kind="lift"')
    expect(rest).toContain('data-kind="rest"')
    // rest glyph is hourglass-shaped (uses triangular <path>s); lift is not
    expect(rest).toContain('<path')
    expect(lift).not.toContain('<path')
  })

  it('is a rounded square (has a corner radius) and valid-looking svg markup', () => {
    const svg = stageIconSvg('legs', 'rest')
    expect(svg).toMatch(/^<svg /)
    expect(svg).toContain('viewBox="0 0 96 96"')
    expect(svg).toMatch(/rx="\d+"/)
  })

  it('is pure — same inputs produce identical output', () => {
    expect(stageIconSvg('pull', 'rest')).toBe(stageIconSvg('pull', 'rest'))
  })
})

describe('stageIconUrl — pure', () => {
  it('returns a data:image/svg+xml URL that decodes back to stageIconSvg output', () => {
    const url = stageIconUrl('push', 'lift')
    expect(url.startsWith('data:image/svg+xml,')).toBe(true)
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length))
    expect(decoded).toBe(stageIconSvg('push', 'lift'))
  })
})

describe('notify — graceful no-ops when unsupported (no Notification global)', () => {
  it('canNotify/notificationPermission report unsupported', () => {
    expect(canNotify()).toBe(false)
    expect(notificationPermission()).toBe('unsupported')
  })

  it('requestNotifyPermission resolves false without throwing', async () => {
    await expect(requestNotifyPermission()).resolves.toBe(false)
  })

  it('notifyRestDone resolves without throwing', async () => {
    await expect(notifyRestDone('push', 'Bench Press')).resolves.toBeUndefined()
  })

  it('setWorkoutBadge/clearWorkoutBadge do not throw when the Badging API is absent', () => {
    expect(() => setWorkoutBadge()).not.toThrow()
    expect(() => clearWorkoutBadge()).not.toThrow()
  })
})

describe('notify — with a mocked Notification API', () => {
  beforeEach(() => {
    MockNotification.instances = []
    MockNotification.permission = 'default'
    MockNotification.requestPermission = vi.fn(async () => MockNotification.permission)
    vi.stubGlobal('Notification', MockNotification)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('canNotify is true and notificationPermission reflects Notification.permission', () => {
    expect(canNotify()).toBe(true)
    MockNotification.permission = 'denied'
    expect(notificationPermission()).toBe('denied')
    MockNotification.permission = 'granted'
    expect(notificationPermission()).toBe('granted')
  })

  it('requestNotifyPermission resolves true only when the browser grants', async () => {
    MockNotification.permission = 'granted'
    await expect(requestNotifyPermission()).resolves.toBe(true)

    MockNotification.permission = 'denied'
    await expect(requestNotifyPermission()).resolves.toBe(false)
  })

  it('notifyRestDone does nothing when permission is not granted', async () => {
    MockNotification.permission = 'default'
    await notifyRestDone('push', 'Bench Press')
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('notifyRestDone falls back to `new Notification` with the calm copy + stage icon when there is no service worker registration', async () => {
    MockNotification.permission = 'granted'
    await notifyRestDone('pull', 'Barbell Row')

    expect(MockNotification.instances).toHaveLength(1)
    const n = MockNotification.instances[0]
    expect(n.title).toBe('Rest done')
    expect(n.options?.body).toBe('Back to Pull — Barbell Row')
    expect(n.options?.tag).toBe('workout-rest')
    expect(n.options?.silent).toBe(false)
    expect(n.options?.icon).toBe(stageIconUrl('pull', 'lift'))
    expect(n.options?.badge).toBe(stageIconUrl('pull', 'lift'))
  })

  it('notifyRestDone omits the exercise name when none is given', async () => {
    MockNotification.permission = 'granted'
    await notifyRestDone('legs')
    expect(MockNotification.instances[0].options?.body).toBe('Back to Legs')
  })

  it('notifyRestDone prefers an active service worker registration when available', async () => {
    MockNotification.permission = 'granted'
    const showNotification = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
    })

    await notifyRestDone('push', 'Bench Press')

    expect(showNotification).toHaveBeenCalledWith(
      'Rest done',
      expect.objectContaining({ body: 'Back to Push — Bench Press', tag: 'workout-rest' }),
    )
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('never throws into the caller even if the underlying API errors', async () => {
    MockNotification.permission = 'granted'
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        getRegistration: vi.fn().mockRejectedValue(new Error('boom')),
      },
    })
    await expect(notifyRestDone('push')).resolves.toBeUndefined()
  })
})

describe('setWorkoutBadge / clearWorkoutBadge — with the Badging API present', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls navigator.setAppBadge / clearAppBadge when available', () => {
    const setAppBadge = vi.fn().mockResolvedValue(undefined)
    const clearAppBadge = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, setAppBadge, clearAppBadge })

    setWorkoutBadge()
    clearWorkoutBadge()

    expect(setAppBadge).toHaveBeenCalledTimes(1)
    expect(clearAppBadge).toHaveBeenCalledTimes(1)
  })

  it('does not throw if setAppBadge/clearAppBadge themselves throw', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      setAppBadge: () => {
        throw new Error('boom')
      },
      clearAppBadge: () => {
        throw new Error('boom')
      },
    })
    expect(() => setWorkoutBadge()).not.toThrow()
    expect(() => clearWorkoutBadge()).not.toThrow()
  })
})
