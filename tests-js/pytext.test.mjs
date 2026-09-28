import test from "node:test"
import assert from "node:assert/strict"
import { pyLen, pyNormalizeWhitespace, pyStrip } from "../src/pytext.mjs"

const cases = [
  [" ASCII ", "ASCII"],
  ["\tline\n", "line"],
  ["\u001cunit\u001c", "unit"],
  ["\u001dunit\u001d", "unit"],
  ["\u001eunit\u001e", "unit"],
  ["\u001funit\u001f", "unit"],
  ["\u0085unit\u0085", "unit"],
  ["\u00a0unit\u00a0", "unit"],
  ["\u1680unit\u1680", "unit"],
  ["\u2007unit\u2007", "unit"],
  ["\u202funit\u202f", "unit"],
  ["\u3000unit\u3000", "unit"],
]

test("pyStrip matches Python whitespace on 12 edge cases", () => {
  for (const [input, expected] of cases) assert.equal(pyStrip(input), expected)
})

test("normalization collapses Python-only internal whitespace", () => {
  assert.equal(pyNormalizeWhitespace("A\u001c\u001dB\u0085C\tD"), "A B C D")
})

test("pyLen counts Unicode code points instead of UTF-16 units", () => {
  assert.equal(pyLen("A😀B"), 3)
  assert.equal(pyLen("e\u0301"), 2)
})
