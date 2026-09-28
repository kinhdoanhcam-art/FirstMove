# StepOrder locked specification

## Semantic relation

There are exactly two declared sides and one arrangement text. The author wrote the text; the other side is named by label and wallet. Validators decide only which side must carry out its part earlier.

- `AUTHOR_FIRST`: the author must move before the other side.
- `OTHER_FIRST`: the named other side must move before the author.

This is not prerequisite classification, deadlock detection, or causal inference. Both moves remain possible. The verdict changes their permitted order.

## Consequence shape

The verdict is an ordering mechanism:

- `AUTHOR_FIRST` makes `confirm_other` revert with `The author moves first` until `confirm_author` succeeds.
- `OTHER_FIRST` makes `confirm_author` revert with `The other side moves first` until `confirm_other` succeeds.

The first successful confirmation stores `first_mover`, changes `OPEN` to `HALF_DONE`, and permanently removes the author's withdrawal path. The second successful confirmation changes `HALF_DONE` to `COMPLETE`. No method may change `order`, notes, or `first_mover` afterward.

## State machine

- `OPEN` → `HALF_DONE` → `COMPLETE`
- `OPEN` → `WITHDRAWN`

`COMPLETE` and `WITHDRAWN` are terminal.

## Fail-safe direction

Malformed, unparseable, unsupported, or unclear model output becomes `AUTHOR_FIRST`. Guessing `OTHER_FIRST` could force a named outside wallet to expose itself first because of ambiguous text written by the author. Guessing `AUTHOR_FIRST` places that cost on the author who supplied the ambiguity. This direction minimizes harm to a non-author.

## Strategic wording and visibility

An author may rewrite text until it honestly says the other side goes first, but cannot do so invisibly. The exact text is permanently stored and visible to the named wallet before it chooses whether to confirm. There is no preview or dry-run endpoint that offers free off-chain grinding.

The principal residual risk is a wrong `OTHER_FIRST` verdict. Mitigations are semantic equality validation, the `AUTHOR_FIRST` fail-safe for malformed output, and the voluntary nature of `confirm_other`.

## Prompt boundary

The prompt receives only:

- the cleaned other-side label inside `<UNTRUSTED_OTHER_SIDE_LABEL>` tags;
- the cleaned arrangement text inside `<UNTRUSTED_ARRANGEMENT_TEXT>` tags.

It never receives either wallet, contract state, selected order, or downstream consequence. Reserved tags and verdict tokens are rejected at input and removed by a fixed-point filter in the defensive check.

## Limits

- Arrangement text: 600 Python code points at contract level.
- Other-side label: 80 Python code points.
- Confirmation note: 300 Python code points.
- Page-size constant: 50.

The 600-character contract cap is not a claim that every such calldata payload works through StudioNet. The frontend path remains capped near the measured safe range until live probing proves more.

## Immutability

Only `open_arrangement` calls the model. It sets `order` exactly once. Every later authorization check, note write, state transition, first-mover record, and withdrawal decision is deterministic.
