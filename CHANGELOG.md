# Changelog

## 2026-09-28 — FirstMove frontend

- Added the Vite/React/TypeScript frontend with same-origin StudioNet RPC proxying.
- Added accepted-state settlement, leader-receipt rollback handling, local arrangement IDs, duplicate preflight, live calldata measurement, and explicit disabled-action reasons.
- Added a 512 px PNG logo, production build configuration, Vercel rewrite, lockfile, and CI workflow.
- Recorded MV-2 and the 10/10 calldata probe without changing the frozen contract source.
- Bound the Project build to its separate finalized deployment at `0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26`.

## 2026-09-28 — StudioNet MV-1 runtime evidence

- Recorded live F4 `AUTHOR_FIRST` and O4 `OTHER_FIRST` verdicts for the same deployed contract and wallets.
- Recorded both expected wrong-order rollbacks, both valid first moves, both valid second moves, the post-first-move withdrawal rollback, and a supplemental role-permission rollback.
- Kept final accepted-state reads and MV-2 explicitly pending; no frontend work was started.

## 2026-09-28 — Semantic hard gate passed

- Confirmed final `COMPLETE` states for both MV-1 branches.
- Recorded F1 `AUTHOR_FIRST` and O5 `OTHER_FIRST` transaction hashes and accepted states.
- Opened Phase 2 frontend authoring without changing the frozen contract source.

## 2026-09-28 — StudioNet deployment

- Deployed the exact measured contract source to `0xDC51b49aF143eFb6671b23C8a4860ab6F17DF72B`.
- Deployment transaction finalized successfully with accepted consensus.
- Runtime semantic rows remain `NOT RUN` until their individual hashes and post-states are recorded.

## 2026-09-27 — Phase 1 candidate

- Added the StepOrder v0.2.16 contract candidate.
- Added the fixed semantic rubric, prompt boundaries, and `AUTHOR_FIRST` fail-safe.
- Added deterministic order teeth, first-mover recording, terminal states, and pre-first-move withdrawal.
- Added kill-set, static source gates, nine deterministic negative tests, Python text parity tests, HTML escaping tests, and accepted-state preflight tests.
- Left all StudioNet runtime evidence as `NOT RUN` pending the required signed session.
- Deliberately deferred FirstMove frontend implementation until MV-1 and MV-2 pass.
