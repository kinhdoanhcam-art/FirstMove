import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const required = [
  '.github/workflows/ci.yml',
  'CHANGELOG.md',
  'LICENSE',
  'LOCKED_SPEC.md',
  'README.md',
  'RUNTIME_EVIDENCE.md',
  'SECURITY.md',
  'SOURCE_SHA256.txt',
  'TESTING.md',
  'TEST_PLAN.md',
  'contracts/StepOrder.py',
  'public/firstmove-logo.png',
  'tools/probe-calldata.mjs',
]

test('submission package contains every required artifact', () => {
  for (const file of required) assert.equal(existsSync(file), true, `missing ${file}`)
})

test('local Markdown file references resolve', () => {
  for (const document of ['README.md', 'TESTING.md', 'RUNTIME_EVIDENCE.md']) {
    const body = readFileSync(document, 'utf8')
    const references = [...body.matchAll(/`([^`]+\.(?:md|py|mjs|txt))`/gi)]
    for (const [, file] of references) {
      assert.equal(existsSync(file), true, `${document} references missing ${file}`)
    }
  }
})
