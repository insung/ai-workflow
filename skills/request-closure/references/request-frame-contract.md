# Request Frame contract

`frame.json` is the machine-readable execution contract. `read-back.md` is a human projection, and `decision-ledger.md` preserves how the current contract was reached. Neither replaces `frame.json`.

## Common fields

| Field | Contract |
| --- | --- |
| `schemaVersion` | `1.0.0` |
| `requestId` | Stable request identifier |
| `status` | `draft`, `needs-user-direction`, or `approved` |
| `depth` | `L1`, `L2`, or `L3` |
| `goal`, `observableOutcome` | Intended change and externally recognizable result |
| `scope.included`, `scope.excluded` | Explicit work boundary and non-goals |
| `acceptanceCriteria[]` | Stable `id` plus testable `statement` |
| `constraints[]` | Constraints that remain true during execution |
| `verificationScenarios[]` | Concrete ways to verify acceptance criteria |
| `authority` | `decisionMaker` and authorization `boundaries` |
| `facts[]`, `inferences[]`, `assumptions[]` | Stable `id` plus `statement`, kept separate by evidence status |
| `decisions[]` | Stable `id`, `statement`, `materiality`, `effect`, and `revisability` |
| `materialOpenItems[]` | Unresolved material items; validation passes only when empty |
| `stalledRounds` | Consecutive rounds without progress on the same material item |
| `approval` | `null` before approval; after approval, the user, time, and exact content digest |

`materiality` is `minor | material | critical`. `effect` is `advisory | default | guardrail | gate`. `revisability` is `easy | moderate | hard`. Approval does not automatically increase a decision's effect.

## Verification scenario

Every acceptance criterion ID must appear in at least one `acceptanceCriteriaRefs[]`. Each scenario contains:

- stable `id`;
- `actor`: `user | developer | automated-test | reviewer`;
- `surface`: `ui | api | cli | database | repository | filesystem | log | document | manual-review | other`;
- non-empty `preconditions[]`, `steps[]`, `expected[]`, and `evidence[]`.

References within one `acceptanceCriteriaRefs[]` must be unique. The CLI reports repeated references as `DUPLICATE_ID`, matching the schema's `uniqueItems` rule.

Choose the boundary the user can actually observe when one exists. For a user-visible UI outcome, repository state, database rows, or logs can support diagnosis but do not replace UI verification. Internal surfaces are appropriate when the requested outcome is itself internal or no user-facing boundary exists.

The scenario describes the verification to perform and the evidence to retain. Its presence does not mean the check ran or passed.

## Depth-specific fields

L1 contains the common fields only. L2 and L3 also require:

- `alternatives[]`: `id`, `option`, and selection `reason`;
- `affectedPaths[]`;
- `sideEffects[]`;
- `reversibility`: `level` and expected `cost`.

L3 also requires:

- `rollback`: strategy, triggers, and recovery evidence;
- `riskImpact`: security, data, cost, and deployment impact;
- `independentReview`: whether review is required and why.

A shallower Frame may retain optional deeper-level fields, for example after reclassification, but every supplied depth-specific field must still satisfy the same shape. The schema and CLI both reject malformed optional L2 or L3 content.

For L3, `authority.boundaries` must explicitly cover the critical decision. The schema can require that the field exists, but only the user can confirm that the stated authority is real and sufficient.

## Validation boundary

[`request-frame.schema.json`](../schemas/request-frame.schema.json) documents the portable shape and conditional fields. The deterministic CLI additionally checks stable-ID duplication, criterion references, full acceptance-criterion coverage, open items, stalled-state consistency, approval actor, and digest integrity:

```bash
node scripts/validate-frame.mjs path/to/frame.json
```

The validator does not decide whether prose is clear, facts are true, alternatives are good, authorization is legitimate, or a verification scenario succeeded. Those judgments remain in discovery, read-back, actual verification, and user approval.

## Digest and state transitions

The digest is SHA-256 over the prospective approved content: remove the top-level `approval` object, normalize `status` to `approved`, then serialize canonical JSON. Object keys are sorted recursively; array order is preserved. Therefore the digest displayed from a structurally valid `draft` remains identical after the user explicitly approves it and only `status` plus `approval` change.

- `approved` requires `approval.approvedBy = "user"` and a matching digest.
- `draft` and `needs-user-direction` require `approval: null`; stale approval metadata is invalid.
- Never recompute a replacement digest after approval to hide a different content change.
- Any change other than the expected `draft` to `approved` lifecycle transition and the new `approval` metadata invalidates prior approval; reopen the Frame as `draft` and ask again.
- Two stalled rounds on the same material item require `needs-user-direction`.
- A material change to goal, scope, or acceptance criteria becomes a new or forked request rather than a silent resume.
