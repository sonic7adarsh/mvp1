export function timeLeft(deadlineIso?: string) {
  if (!deadlineIso) return null
  const deadline = new Date(deadlineIso).getTime()
  const diff = deadline - Date.now()
  if (diff <= 0) return 0
  return diff
}

export function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m}m ${sec}s`
}