import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  canonicalize,
  computeFrameDigest,
  validateFrame,
} from "../scripts/frame-contract.mjs";

const CLI_PATH = fileURLToPath(
  new URL("../scripts/validate-frame.mjs", import.meta.url),
);
const APPROVED_EXAMPLE_PATH = fileURLToPath(
  new URL("../examples/approved-l1-frame.json", import.meta.url),
);
const OPEN_EXAMPLE_PATH = fileURLToPath(
  new URL("../examples/open-l2-frame.json", import.meta.url),
);

const approvedL1Frame = {
  schemaVersion: "1.0.0",
  requestId: "REQ-001",
  status: "approved",
  depth: "L1",
  goal: "Validate a request frame deterministically.",
  observableOutcome: "The validator returns a stable result for the same frame.",
  scope: {
    included: ["Request Frame validation"],
    excluded: ["Executing the approved request"],
  },
  acceptanceCriteria: [
    {
      id: "AC-001",
      statement: "A valid approved L1 frame exits successfully.",
    },
  ],
  constraints: ["Use only the Node.js standard library."],
  verificationScenarios: [
    {
      id: "VS-001",
      acceptanceCriteriaRefs: ["AC-001"],
      actor: "automated-test",
      surface: "cli",
      preconditions: ["The frame is stored as UTF-8 JSON."],
      steps: ["Run validate-frame.mjs with the frame path."],
      expected: ["The process exits with status 0."],
      evidence: ["The JSON result contains valid=true."],
    },
  ],
  authority: {
    decisionMaker: "user",
    boundaries: ["Approval authorizes only the work described by this frame."],
  },
  facts: [
    {
      id: "FACT-001",
      statement: "The validator runs on Node.js 23.",
    },
  ],
  inferences: [],
  assumptions: [],
  decisions: [
    {
      id: "DEC-001",
      statement: "Use a CLI verification surface.",
      materiality: "minor",
      effect: "default",
      revisability: "easy",
    },
  ],
  materialOpenItems: [],
  stalledRounds: 0,
  approval: {
    approvedBy: "user",
    approvedAt: "2026-09-21T00:00:00.000Z",
    frameDigest: "696219a3e4ddbb5992e36ac838a9be42a069574c0eeb5744b2a5f17c51bef3e9",
  },
};

function copyFrame() {
  return structuredClone(approvedL1Frame);
}

function errorCodes(result) {
  return result.errors.map(({ code }) => code);
}

test("accepts an approved L1 frame whose criteria have verification scenarios", () => {
  const result = validateFrame(copyFrame());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.digest, approvedL1Frame.approval.frameDigest);
});

test("preserves the displayed digest from draft through explicit approval", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "request-closure-approval-"));
  const framePath = join(directory, "frame.json");
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const draft = copyFrame();
  draft.status = "draft";
  draft.approval = null;
  writeFileSync(framePath, JSON.stringify(draft), "utf8");

  const draftRun = spawnSync(process.execPath, [CLI_PATH, framePath], {
    encoding: "utf8",
  });
  const beforeApproval = JSON.parse(draftRun.stdout);

  assert.equal(draftRun.status, 0, draftRun.stdout || draftRun.stderr);
  assert.equal(beforeApproval.valid, true);
  assert.deepEqual(beforeApproval.errors, []);
  assert.equal(
    beforeApproval.digest,
    "696219a3e4ddbb5992e36ac838a9be42a069574c0eeb5744b2a5f17c51bef3e9",
  );

  const approved = structuredClone(draft);
  approved.status = "approved";
  approved.approval = {
    approvedBy: "user",
    approvedAt: "2026-09-21T00:00:00.000Z",
    frameDigest: beforeApproval.digest,
  };
  writeFileSync(framePath, JSON.stringify(approved), "utf8");

  const approvedRun = spawnSync(process.execPath, [CLI_PATH, framePath], {
    encoding: "utf8",
  });
  const afterApproval = JSON.parse(approvedRun.stdout);

  assert.equal(approvedRun.status, 0, approvedRun.stdout || approvedRun.stderr);
  assert.equal(afterApproval.valid, true);
  assert.deepEqual(afterApproval.errors, []);
  assert.equal(afterApproval.digest, beforeApproval.digest);
});

test("rejects approval metadata before the frame is approved", () => {
  const frame = copyFrame();
  frame.status = "draft";

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("APPROVAL_REQUIRED"));
  assert.ok(!errorCodes(result).includes("DIGEST_MISMATCH"));
});

test("rejects a non-object frame", () => {
  const result = validateFrame(null);

  assert.equal(result.valid, false);
  assert.deepEqual(errorCodes(result), ["FRAME_TYPE"]);
});

test("rejects an unsupported schema version", () => {
  const frame = copyFrame();
  frame.schemaVersion = "2.0.0";

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("SCHEMA_VERSION"));
});

test("rejects invalid enum values", async (t) => {
  for (const [path, mutate] of [
    ["$.status", (frame) => (frame.status = "closed")],
    [
      "$.verificationScenarios[0].actor",
      (frame) => (frame.verificationScenarios[0].actor = "agent"),
    ],
    [
      "$.verificationScenarios[0].surface",
      (frame) => (frame.verificationScenarios[0].surface = "memory"),
    ],
    [
      "$.decisions[0].effect",
      (frame) => (frame.decisions[0].effect = "mandatory"),
    ],
  ]) {
    await t.test(path, () => {
      const frame = copyFrame();
      mutate(frame);

      const result = validateFrame(frame);

      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some(
          ({ code, path: errorPath }) =>
            code === "INVALID_ENUM" && errorPath === path,
        ),
      );
    });
  }
});

test("rejects duplicate stable IDs", () => {
  const frame = copyFrame();
  frame.facts.push({
    id: "FACT-001",
    statement: "This duplicate must be rejected.",
  });

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("DUPLICATE_ID"));
});

test("rejects a missing common required field", () => {
  const frame = copyFrame();
  delete frame.observableOutcome;

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("REQUIRED_FIELD"));
  assert.ok(result.errors.some(({ path }) => path === "$.observableOutcome"));
});

test("rejects a criterion with no verification scenario", () => {
  const frame = copyFrame();
  frame.acceptanceCriteria.push({
    id: "AC-002",
    statement: "Every acceptance criterion is covered.",
  });

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("UNVERIFIED_ACCEPTANCE_CRITERION"));
});

test("rejects a scenario that references an unknown criterion", () => {
  const frame = copyFrame();
  frame.verificationScenarios[0].acceptanceCriteriaRefs = ["AC-404"];

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("UNKNOWN_ACCEPTANCE_CRITERION"));
});

test("rejects duplicate criterion references within one scenario", () => {
  const frame = copyFrame();
  frame.verificationScenarios[0].acceptanceCriteriaRefs = ["AC-001", "AC-001"];
  frame.approval.frameDigest = computeFrameDigest(frame);

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some(
      ({ code, path }) =>
        code === "DUPLICATE_ID" &&
        path === "$.verificationScenarios[0].acceptanceCriteriaRefs[1]",
    ),
  );
  assert.ok(!errorCodes(result).includes("DIGEST_MISMATCH"));
});

test("rejects a scenario with an empty verification field", async (t) => {
  for (const field of ["preconditions", "steps", "expected", "evidence"]) {
    await t.test(field, () => {
      const frame = copyFrame();
      frame.verificationScenarios[0][field] = [];

      const result = validateFrame(frame);

      assert.equal(result.valid, false);
      assert.ok(errorCodes(result).includes("EMPTY_VERIFICATION_FIELD"));
      assert.ok(result.errors.some(({ path }) => path.endsWith(`.${field}`)));
    });
  }
});

test("requires approval metadata for an approved frame", () => {
  const frame = copyFrame();
  frame.approval = null;

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("APPROVAL_REQUIRED"));
});

test("rejects material open items and non-user approval", async (t) => {
  await t.test("material open item", () => {
    const frame = copyFrame();
    frame.materialOpenItems = [
      {
        id: "OPEN-001",
        statement: "The release owner is not yet known.",
      },
    ];

    const result = validateFrame(frame);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("MATERIAL_OPEN"));
  });

  await t.test("approval actor", () => {
    const frame = copyFrame();
    frame.approval.approvedBy = "agent";

    const result = validateFrame(frame);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("APPROVAL_ACTOR"));
  });
});

test("rejects an approved frame after content changes invalidate its digest", () => {
  const frame = copyFrame();
  frame.goal = "A changed goal that was not approved.";

  const result = validateFrame(frame);

  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes("DIGEST_MISMATCH"));
});

test("requires L2 impact fields and L3 rollback risk and review fields", async (t) => {
  await t.test("L2", () => {
    const frame = copyFrame();
    frame.depth = "L2";
    frame.approval.frameDigest = computeFrameDigest(frame);

    const result = validateFrame(frame);

    assert.equal(result.valid, false);
    assert.equal(
      result.errors.filter(({ code }) => code === "DEPTH_REQUIREMENT").length,
      4,
    );
  });

  await t.test("L3", () => {
    const frame = copyFrame();
    frame.depth = "L3";
    frame.alternatives = [
      {
        id: "ALT-001",
        option: "Keep the current workflow.",
        reason: "It is easier to reverse.",
      },
    ];
    frame.affectedPaths = ["CLI consumers"];
    frame.sideEffects = ["The request may take longer to close."];
    frame.reversibility = {
      level: "moderate",
      cost: "Restore the prior Frame and ask for approval again.",
    };
    frame.approval.frameDigest = computeFrameDigest(frame);

    const result = validateFrame(frame);

    assert.equal(result.valid, false);
    assert.equal(
      result.errors.filter(({ code }) => code === "DEPTH_REQUIREMENT").length,
      3,
    );
  });
});

test("rejects malformed L2 and L3 depth fields", async (t) => {
  await t.test("L2 field contents", () => {
    const frame = copyFrame();
    frame.depth = "L2";
    frame.alternatives = [{ id: "", option: "", reason: "" }];
    frame.affectedPaths = [""];
    frame.sideEffects = [];
    frame.reversibility = { level: "instant", cost: "" };
    frame.approval.frameDigest = computeFrameDigest(frame);

    const result = validateFrame(frame);
    const depthPaths = result.errors
      .filter(({ code }) => code === "DEPTH_REQUIREMENT")
      .map(({ path }) => path);

    assert.equal(result.valid, false);
    assert.deepEqual(depthPaths, [
      "$.alternatives[0].id",
      "$.alternatives[0].option",
      "$.alternatives[0].reason",
      "$.affectedPaths",
      "$.sideEffects",
      "$.reversibility.level",
      "$.reversibility.cost",
    ]);
  });

  await t.test("L3 field contents", () => {
    const frame = copyFrame();
    frame.depth = "L3";
    frame.alternatives = [
      { id: "ALT-001", option: "Keep the current flow.", reason: "Reversible." },
    ];
    frame.affectedPaths = ["API consumer"];
    frame.sideEffects = ["Extra validation step"];
    frame.reversibility = { level: "moderate", cost: "Repeat approval." };
    frame.rollback = { strategy: "", triggers: [], recoveryEvidence: [] };
    frame.riskImpact = { security: "", data: "", cost: "", deployment: "" };
    frame.independentReview = { required: "yes", rationale: "" };
    frame.approval.frameDigest = computeFrameDigest(frame);

    const result = validateFrame(frame);
    const depthPaths = result.errors
      .filter(({ code }) => code === "DEPTH_REQUIREMENT")
      .map(({ path }) => path);

    assert.equal(result.valid, false);
    assert.deepEqual(depthPaths, [
      "$.rollback.strategy",
      "$.rollback.triggers",
      "$.rollback.recoveryEvidence",
      "$.riskImpact.security",
      "$.riskImpact.data",
      "$.riskImpact.cost",
      "$.riskImpact.deployment",
      "$.independentReview.required",
      "$.independentReview.rationale",
    ]);
  });
});

test("rejects malformed optional deeper fields on lower-depth frames", async (t) => {
  await t.test("L1 with supplied L2 and L3 fields", () => {
    const frame = copyFrame();
    frame.alternatives = [{}];
    frame.rollback = { strategy: 123 };
    frame.approval.frameDigest = computeFrameDigest(frame);

    const result = validateFrame(frame);
    const depthPaths = result.errors
      .filter(({ code }) => code === "DEPTH_REQUIREMENT")
      .map(({ path }) => path);

    assert.equal(result.valid, false);
    assert.ok(depthPaths.includes("$.alternatives[0].id"));
    assert.ok(depthPaths.includes("$.rollback.strategy"));
    assert.ok(!errorCodes(result).includes("DIGEST_MISMATCH"));
  });

  await t.test("L2 with a supplied L3 field", () => {
    const frame = copyFrame();
    frame.depth = "L2";
    frame.alternatives = [
      { id: "ALT-001", option: "Keep the current flow.", reason: "Reversible." },
    ];
    frame.affectedPaths = ["API consumer"];
    frame.sideEffects = ["Extra validation step"];
    frame.reversibility = { level: "moderate", cost: "Repeat approval." };
    frame.independentReview = { required: "yes", rationale: "" };
    frame.approval.frameDigest = computeFrameDigest(frame);

    const result = validateFrame(frame);
    const depthPaths = result.errors
      .filter(({ code }) => code === "DEPTH_REQUIREMENT")
      .map(({ path }) => path);

    assert.equal(result.valid, false);
    assert.deepEqual(depthPaths, [
      "$.independentReview.required",
      "$.independentReview.rationale",
    ]);
    assert.ok(!errorCodes(result).includes("DIGEST_MISMATCH"));
  });
});

test("requires needs-user-direction after two stalled rounds", async (t) => {
  await t.test("two stalled rounds require the matching status", () => {
    const frame = copyFrame();
    frame.status = "draft";
    frame.stalledRounds = 2;
    frame.approval = null;

    const result = validateFrame(frame);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("STALL_STATUS_MISMATCH"));
  });

  await t.test("needs-user-direction requires two stalled rounds", () => {
    const frame = copyFrame();
    frame.status = "needs-user-direction";
    frame.stalledRounds = 1;
    frame.approval = null;

    const result = validateFrame(frame);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("STALL_STATUS_MISMATCH"));
  });
});

test("canonical digest ignores approval and object key insertion order", () => {
  const first = {
    b: 2,
    a: { d: 4, c: 3 },
    list: [{ z: 1, y: 2 }],
    approval: { approvedBy: "user", frameDigest: "old" },
  };
  const second = {
    approval: { frameDigest: "new", approvedBy: "someone-else" },
    list: [{ y: 2, z: 1 }],
    a: { c: 3, d: 4 },
    b: 2,
  };

  assert.equal(
    canonicalize(first),
    '{"a":{"c":3,"d":4},"approval":{"approvedBy":"user","frameDigest":"old"},"b":2,"list":[{"y":2,"z":1}]}',
  );
  assert.equal(computeFrameDigest(first), computeFrameDigest(second));
  assert.equal(
    computeFrameDigest(first),
    "1f3fa3d75e34755005f2dedd8ff5ddec81ac79aea5a84642c44e51c5f9831254",
  );
});

test("CLI reports invalid JSON separately from a structurally invalid frame", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "request-closure-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const invalidJsonPath = join(directory, "invalid-json.json");
  const invalidFramePath = join(directory, "invalid-frame.json");
  writeFileSync(invalidJsonPath, "{not-json", "utf8");
  writeFileSync(invalidFramePath, JSON.stringify({}), "utf8");

  const parseFailure = spawnSync(process.execPath, [CLI_PATH, invalidJsonPath], {
    encoding: "utf8",
  });
  const structuralFailure = spawnSync(
    process.execPath,
    [CLI_PATH, invalidFramePath],
    { encoding: "utf8" },
  );

  assert.equal(parseFailure.status, 2);
  assert.equal(JSON.parse(parseFailure.stdout).errors[0].code, "JSON_PARSE_ERROR");
  assert.equal(structuralFailure.status, 1);
  assert.ok(
    JSON.parse(structuralFailure.stdout).errors.some(
      ({ code }) => code === "REQUIRED_FIELD",
    ),
  );
});

test("shipped approved L1 example passes through the CLI", () => {
  const result = spawnSync(
    process.execPath,
    [CLI_PATH, APPROVED_EXAMPLE_PATH],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stdout || result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("shipped open L2 example fails with a material open item", () => {
  const result = spawnSync(process.execPath, [CLI_PATH, OPEN_EXAMPLE_PATH], {
    encoding: "utf8",
  });
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 1, result.stdout || result.stderr);
  assert.equal(output.valid, false);
  assert.ok(output.errors.some(({ code }) => code === "MATERIAL_OPEN"));
});
