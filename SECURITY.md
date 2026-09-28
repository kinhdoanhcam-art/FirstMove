# StepOrder security notes

## Prompt boundary

Only the cleaned arrangement text and cleaned other-side label enter the prompt. Wallets, author address, selected order, state, and contract consequences are excluded. Both fields are wrapped in explicit untrusted-data tags.

Inputs containing a reserved tag or either verdict token are rejected case-insensitively. The defensive token remover runs to a fixed point so nested constructions cannot reveal a reserved token after only one pass.

Validator agreement reruns the same semantic evaluation and requires an exact supported verdict. This equality check is a consensus check, not an injection defense; the input boundary remains necessary.

## Fail-safe

Malformed, unclear, or unsupported output becomes `AUTHOR_FIRST`. This may burden the author, who wrote the ambiguous text, but does not force the named outside wallet to move first.

## Deterministic authorization

- Only the author can call `confirm_author` or withdraw.
- Only the exact normalized other wallet can call `confirm_other`.
- The later side is rejected until the earlier side is confirmed.
- Each side can confirm once.
- Withdrawal is permanently disabled when `first_mover` is nonempty.
- `COMPLETE` and `WITHDRAWN` reject further confirmations.

## Residual limitations

- The contract does not verify identity, real-world performance, payment, delivery, or truth.
- A second wallet does not prove a second person.
- The other side voluntarily chooses whether to confirm after reading the public text.
- There is no clock, deadline, escrow, external web source, or administrator.
- Live semantic accuracy must be measured on StudioNet; offline tests cannot substitute for the four must-verify transactions.
