export function isTickerEcho(value: string | null | undefined, ticker: string) {
  const name = value?.trim()
  const normalizedTicker = ticker.trim().toUpperCase()
  return Boolean(name && normalizedTicker && name.toUpperCase() === normalizedTicker)
}

export function resolveStockDisplayName(
  ticker: string,
  ...candidates: Array<string | null | undefined>
) {
  const normalizedTicker = ticker.trim().toUpperCase()
  const names = candidates
    .map((candidate) => candidate?.trim())
    .filter((candidate): candidate is string => Boolean(candidate))

  return names.find((name) => !isTickerEcho(name, normalizedTicker)) ?? names[0] ?? normalizedTicker
}
