import {
  getAdminAlertPreferences,
  type AdminAlertSound,
} from '@/lib/admin-alert-preferences'

let sharedAudioContext: AudioContext | null = null
let sharedAlertAudio: HTMLAudioElement | null = null

function createBeepDataUri() {
  const sampleRate = 8000
  const durationSec = 0.18
  const numSamples = Math.floor(sampleRate * durationSec)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  function writeString(offset: number, value: string) {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate
    const freq = i < numSamples * 0.45 ? 880 : 1174
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.35
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }

  return `data:audio/wav;base64,${btoa(binary)}`
}

function getAlertAudioElement() {
  if (typeof window === 'undefined') return null
  if (!sharedAlertAudio) {
    sharedAlertAudio = new Audio(createBeepDataUri())
    sharedAlertAudio.preload = 'auto'
  }
  return sharedAlertAudio
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported' as const
  }
  if (Notification.permission === 'granted') return 'granted' as const
  if (Notification.permission === 'denied') return 'denied' as const
  const result = await Notification.requestPermission()
  return result
}

export function unlockAlertAudio() {
  if (typeof window === 'undefined') return

  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext()
    }
    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume()
    }
  } catch {
    // ignore
  }

  const audio = getAlertAudioElement()
  if (!audio) return

  audio.muted = true
  void audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
    })
    .catch(() => {
      audio.muted = false
    })
}

function getAudioContext() {
  unlockAlertAudio()
  if (sharedAudioContext) return sharedAudioContext

  try {
    sharedAudioContext = new AudioContext()
    return sharedAudioContext
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  startAt: number,
  oscillatorType: OscillatorType,
  freq1: number,
  freq2: number,
  duration: number,
  peakGain: number
) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = oscillatorType
  oscillator.frequency.setValueAtTime(freq1, startAt)
  oscillator.frequency.setValueAtTime(freq2, startAt + 0.1)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration)
}

type ToneStep = {
  at: number
  type: OscillatorType
  freq1: number
  freq2: number
  duration: number
  gain: number
}

const SOUND_PATTERNS: Record<Exclude<AdminAlertSound, 'off'>, ToneStep[]> = {
  classic: [
    { at: 0, type: 'sine', freq1: 880, freq2: 1174, duration: 0.28, gain: 0.35 },
    { at: 0.22, type: 'sine', freq1: 880, freq2: 1174, duration: 0.28, gain: 0.35 },
  ],
  chime: [
    { at: 0, type: 'triangle', freq1: 659, freq2: 784, duration: 0.42, gain: 0.28 },
  ],
  bell: [
    { at: 0, type: 'sine', freq1: 784, freq2: 988, duration: 0.35, gain: 0.32 },
    { at: 0.18, type: 'sine', freq1: 988, freq2: 1174, duration: 0.35, gain: 0.28 },
  ],
  urgent: [
    { at: 0, type: 'square', freq1: 988, freq2: 988, duration: 0.12, gain: 0.22 },
    { at: 0.14, type: 'square', freq1: 988, freq2: 988, duration: 0.12, gain: 0.22 },
    { at: 0.28, type: 'square', freq1: 988, freq2: 988, duration: 0.12, gain: 0.22 },
    { at: 0.5, type: 'sine', freq1: 1174, freq2: 1318, duration: 0.3, gain: 0.3 },
  ],
}

function playOscillatorPattern(
  sound: Exclude<AdminAlertSound, 'off'>,
  volume: number
) {
  const ctx = getAudioContext()
  if (!ctx) return false

  const pattern = SOUND_PATTERNS[sound]
  if (!pattern?.length) return false

  try {
    const now = ctx.currentTime
    for (const step of pattern) {
      playTone(
        ctx,
        now + step.at,
        step.type,
        step.freq1,
        step.freq2,
        step.duration,
        step.gain * volume
      )
    }
    return true
  } catch {
    return false
  }
}

function playHtmlAudioAlert(volume: number) {
  const audio = getAlertAudioElement()
  if (!audio) return false

  audio.volume = volume
  audio.currentTime = 0
  void audio.play().catch(() => {})
  window.setTimeout(() => {
    audio.currentTime = 0
    void audio.play().catch(() => {})
  }, 240)
  return true
}

export function playOrderAlertSound() {
  const { sound, volume } = getAdminAlertPreferences()
  if (sound === 'off') return

  unlockAlertAudio()
  const played = playOscillatorPattern(sound, volume)
  if (!played || sound === 'classic') {
    playHtmlAudioAlert(volume)
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(sound === 'urgent' ? [80, 50, 80, 50, 120] : [120, 80, 120])
  }
}

export function showOrderNotification(title: string, body: string, tag?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    new Notification(title, {
      body,
      icon: '/brand/gaia-logo.png',
      tag: tag ?? 'gaiapasta-order',
    })
  } catch {
    // ignore
  }
}

export function playCustomerAlertSound() {
  unlockAlertAudio()
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    playTone(ctx, now, 'triangle', 523, 659, 0.28, 0.12)
  } catch {
    // ignore
  }
}
