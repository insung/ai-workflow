---
name: request-closure
description: Use when a user explicitly invokes $request-closure or explicitly selects request closure for an open request whose scope, acceptance, authority, or verification decisions must be resolved before execution.
---

# Request Closure

Turn an open request into a user-approved, verifiable Request Frame. This skill closes the request only; it never implements it or starts a Worker or Verifier.

## Write boundary

Treat the target project as read-only except for `.agent-workflow/requests/<request-id>/`. Create or update only these closure artifacts there:

- `raw-request.md`: append-only user messages in chronological order;
- `frame.json`: the single machine-readable execution contract;
- `decision-ledger.md`: facts, inferences, assumptions, proposals, decisions, and supersession history;
- `read-back.md`: a regenerable human projection of the current Frame.

Approval of closure work is not permission to change any other target-project file.

## Closure loop

1. **Capture.** Before interpreting a message, append it verbatim to `raw-request.md`. Append later answers; never replace earlier evidence with a summary.
2. **Discover.** Read only what is needed to identify affected behavior and constraints. Record facts separately from inferences, assumptions, proposals, and user decisions. Never promote an inference or proposal into a decision.
3. **Set depth.** Propose L1, L2, or L3 from impact and reversibility, then let the user override it. Use L2 for multiple paths, consumers, contracts, or costly rework. Use L3 for security, privacy, data loss, major cost, outage, or hard-to-reverse change. Read [the Frame contract](references/request-frame-contract.md) when constructing or changing `frame.json`; use the [approved](examples/approved-l1-frame.json) and [open](examples/open-l2-frame.json) examples only as shape references.
4. **Ask the material frontier.** Ask only the earliest unresolved decision that can change the result, verification, authority, or safe execution plan. Continue as answers expose dependencies; do not use a fixed questionnaire or infer closure because discovery made one path look obvious.
5. **Define verification.** Connect every acceptance criterion to at least one scenario with a real actor, surface, preconditions, steps, expected results, and retained evidence. Prefer the user-observable boundary when one exists. A planned scenario is not executed evidence.
6. **Read back.** Regenerate `read-back.md` from the current Frame using [the template](assets/read-back-template.md). Add Before/After, flow, or impact views only when those relationships materially improve understanding. Ask the user to correct misunderstandings before validation.
7. **Validate.** Run `node <request-closure-skill-dir>/scripts/validate-frame.mjs <target-project>/.agent-workflow/requests/<request-id>/frame.json`. On any error, return to the relevant open item, update the ledger, regenerate the read-back, and validate again. The validator checks structure and digest integrity, not semantic truth or execution success.
8. **Approve the exact content.** With `status: draft` and `approval: null`, present the validator's digest and ask the user to approve that exact digest. The digest represents the prospective approved content: the validator excludes `approval` and normalizes `status` to `approved`. Only the user's explicit approval counts. After approval, change only `status` to `approved` and record `approvedBy: user`, time, and the displayed digest. Rerun the validator and require its digest to remain byte-for-byte identical; never recompute a replacement digest to conceal another content change. Any other content change invalidates approval and reopens the Frame.
9. **Stop.** When the approved Frame validates, report the four closure artifacts and stop. Do not implement, edit product documentation, dispatch execution, or claim that verification scenarios passed.

## Stalled material decisions

Track consecutive rounds without progress on the same material item. After two such rounds, set `stalledRounds` to `2`, set `status` to `needs-user-direction`, preserve the unresolved item, and stop for user direction. Reset the count only when that item advances or is explicitly reclassified.

Supersede decisions in `decision-ledger.md`; never delete their history. A material change to goal, scope, or acceptance criteria is a new or forked request, not a silent resume.
