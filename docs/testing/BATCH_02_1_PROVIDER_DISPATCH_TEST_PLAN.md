# Batch 02.1 Provider Dispatch Test and Evaluation Plan

**Pull request:** [PR #7](https://github.com/farmconnect-ux/cultivanode/pull/7) (**Merged** into `main` at `529773da0acc6b8c30a869bc96f2961aff1fa3d9`; `main` CI Run [44155950274](https://github.com/farmconnect-ux/cultivanode/actions/runs/44155950274))  
**Target branch:** `main`  
**Scope:** Mobile provider inbox, provider access, evidence deep links, job decline, GPS check-in and work-proof upload.  
**Environment:** Automated tests run in GitHub Actions against mocked mobile service boundaries and an isolated local Supabase database. No Production credentials or records are used.

## 1. Automated test gates

The mobile Vitest suite covers live provider-side booking filtering, empty results without demo fallbacks, network/authentication/permission/invalid response classification, UUID validation, provider-role checks, owner-scoped machinery listing queries, decline reason validation, and proof-upload authentication/storage/RPC sequencing.

The new acceptance evaluation suite adds boundary cases for UUID inputs, role combinations, decline-reason lengths, and common Supabase/network failure classes. These tests are deterministic unit evaluations. They do not claim to render or operate a native iOS interface.

The repository CI workflow must pass all of the following before merge: workspace typecheck, lint, all workspace unit tests, Next.js production build, local Supabase migration startup, and the complete pgTAP database suite.

## 2. Workflow acceptance matrix

| ID | Scenario | Expected result | Verification |
|---|---|---|---|
| PD-01 | Signed-out user opens an evidence deep link | Redirect to sign-in; no job data displayed | Route review and auth-boundary tests |
| PD-02 | Signed-in farmer opens an evidence deep link | Provider access denied; no evidence screen displayed | Provider-role evaluation |
| PD-03 | Equipment or service provider opens a valid assigned job | Job loads from live provider booking data | Provider dispatch unit test |
| PD-04 | Malformed job identifier is opened | Invalid-link state; no database lookup | UUID evaluation |
| PD-05 | Job is absent from the provider's returned bookings | Not-found state; no fabricated job | Empty and missing-job unit tests |
| PD-06 | Provider inbox has no bookings | Explicit empty state; no demo bookings | Empty-result unit test |
| PD-07 | Provider declines with blank, short or oversized reason | Validation blocks submission | Decline boundary evaluations |
| PD-08 | Provider submits a valid decline reason | Trimmed reason sent to decline RPC; failure remains visible | Decline service tests and Android/iOS manual check |
| PD-09 | Provider accepts a booking | Accept RPC success updates status; failure does not show success | Service test and manual check |
| PD-10 | GPS check-in RPC fails | User sees failure; local state is not marked checked in | Source regression review and manual device check |
| PD-11 | Proof upload has no authenticated user | Upload and proof RPC are not attempted | Proof-upload unit test |
| PD-12 | Proof image storage upload fails | Proof RPC is not called; failure is returned | Proof-upload unit test |
| PD-13 | Proof image uploads but proof RPC fails | Submission reports failure; no success is shown | Proof-upload service test and manual device check |
| PD-14 | Provider fleet query runs | Listings are scoped to the authenticated owner and use current listing-rate schema | Machinery query unit test |
| PD-15 | Network, authentication, RLS or database failure occurs | Correct failure class and recoverable UI state are shown | Failure-classification evaluations |

## 3. Device and simulator evaluation

A physical iOS device is not available in the current test environment. Therefore, physical iOS verification is explicitly marked **not run**, not passed.

Before treating the native interaction layer as fully device-verified, run the following on an Android emulator or Android handset and, when available, an iOS simulator/device:

1. Open a provider inbox request, open the decline modal, focus the input, enter a valid reason, submit, and verify the request changes to declined only after server success.
2. Repeat with blank and over-length reasons, confirm submission is blocked and the validation message is visible.
3. Open an evidence deep link while signed out, as a farmer, and as an authorised provider.
4. Grant location permission, perform a GPS check-in, deny permission, and simulate a failed network request. Only server-confirmed check-in may display success.
5. Capture/select a proof photo, upload it, and verify the proof record is created. Repeat with storage/network failure and confirm the UI reports failure without false success.
6. Use a small screen and open the keyboard while the decline modal is visible. Confirm the input and action buttons remain reachable, the modal can be cancelled, and repeated taps do not create duplicate submissions.

## 4. Release decision

Merge is permitted only when the latest PR head has green required CI checks, the acceptance evaluation suite passes, no unresolved review blocker remains, and the PR is mergeable. The absence of an iOS handset is a documented residual limitation, not evidence of a successful iOS device test.

This test plan does not authorise Production database changes, credential changes, feature-flag changes, or deployment. A merge may trigger the repository's configured deployment integrations; inspect those integrations and deployment status separately.
