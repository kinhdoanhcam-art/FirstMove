import test from "node:test"
import assert from "node:assert/strict"
import { escapeHtml } from "../src/security.mjs"

test("contract text is escaped before HTML insertion", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('x')"> & done`),
    "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; done",
  )
})
