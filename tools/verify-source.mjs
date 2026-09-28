import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const sourcePath = new URL("../contracts/StepOrder.py", import.meta.url)
const recordPath = new URL("../SOURCE_SHA256.txt", import.meta.url)

function canonical(bytes) {
  return bytes.toString("utf8").replaceAll("\r\n", "\n").replace(/\n?$/, "\n")
}

const source = canonical(await readFile(sourcePath))
const expectedLine = (await readFile(recordPath, "utf8")).trim()
const expected = expectedLine.split(/\s+/)[0]
const actual = createHash("sha256").update(source, "utf8").digest("hex")

if (actual !== expected) {
  console.error(`Source hash mismatch: expected ${expected}, got ${actual}`)
  process.exit(1)
}

console.log(`Source hash verified: ${actual}`)
