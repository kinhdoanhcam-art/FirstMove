import { keccak256, toBytes } from 'viem'
import { pyLen, pyNormalizeWhitespace, pyStrip } from './pytext.mjs'

export function arrangementIdFor(author: string, text: string) {
  const cleanText = pyStrip(text)
  const normalizedText = pyNormalizeWhitespace(cleanText)
  const payload =
    'STEP_ORDER:ARRANGEMENT:V1|' +
    author.toLowerCase() +
    '|' +
    pyLen(normalizedText) +
    '|' +
    normalizedText

  return keccak256(toBytes(payload)).slice(2).toLowerCase()
}

export function isArrangementId(value: string) {
  return /^[a-fA-F0-9]{64}$/.test(value.trim())
}
