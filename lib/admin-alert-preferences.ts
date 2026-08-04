export const ADMIN_ALERT_SOUNDS = {
  classic: 'Clásico (doble beep)',
  chime: 'Campana suave',
  bell: 'Campana fuerte',
  urgent: 'Urgente (triple beep)',
  off: 'Silencioso (solo visual)',
} as const

export type AdminAlertSound = keyof typeof ADMIN_ALERT_SOUNDS

export type AdminAlertPreferences = {
  sound: AdminAlertSound
  volume: number
}

const STORAGE_KEY = 'gp-admin-alert-prefs-v1'

const DEFAULTS: AdminAlertPreferences = {
  sound: 'classic',
  volume: 0.85,
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULTS.volume
  return Math.min(1, Math.max(0.05, value))
}

export function getAdminAlertPreferences(): AdminAlertPreferences {
  if (typeof window === 'undefined') return DEFAULTS

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<AdminAlertPreferences>
    const sound =
      parsed.sound && parsed.sound in ADMIN_ALERT_SOUNDS
        ? parsed.sound
        : DEFAULTS.sound

    return {
      sound,
      volume: clampVolume(parsed.volume ?? DEFAULTS.volume),
    }
  } catch {
    return DEFAULTS
  }
}

export function saveAdminAlertPreferences(
  partial: Partial<AdminAlertPreferences>
) {
  if (typeof window === 'undefined') return

  const next = {
    ...getAdminAlertPreferences(),
    ...partial,
    volume: clampVolume(partial.volume ?? getAdminAlertPreferences().volume),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('gp-admin-alert-prefs'))
}

export function onAdminAlertPreferencesChange(listener: () => void) {
  if (typeof window === 'undefined') return () => {}

  const handler = () => listener()
  window.addEventListener('gp-admin-alert-prefs', handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener('gp-admin-alert-prefs', handler)
    window.removeEventListener('storage', handler)
  }
}
