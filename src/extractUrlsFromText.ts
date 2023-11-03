export function extractUrlsFromText(text: string) {
  const urlRegex = /https?:\/\/[^\s>|]+/g
  const matches = text.match(urlRegex)
  if (matches) {
    return matches
  } else {
    return []
  }
}