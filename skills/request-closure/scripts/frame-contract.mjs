import { createHash } from "node:crypto";

const STATUS_VALUES = ["draft", "needs-user-direction", "approved"];
const DEPTH_VALUES = ["L1", "L2", "L3"];
const ACTOR_VALUES = ["user", "developer", "automated-test", "reviewer"];
const SURFACE_VALUES = [
  "ui",
  "api",
  "cli",
  "database",
  "repository",
  "filesystem",
  "log",
  "document",
  "manual-review",
  "other",
];
const MATERIALITY_VALUES = ["minor", "material", "critical"];
const EFFECT_VALUES = ["advisory", "default", "guardrail", "gate"];
const REVISABILITY_VALUES = ["easy", "moderate", "hard"];

const REQUIRED_FIELDS = [
  "schemaVersion",
  "requestId",
  "status",
  "depth",
  "goal",
  "observableOutcome",
  "scope",
  "acceptanceCriteria",
  "constraints",
  "verificationScenarios",
  "authority",
  "facts",
  "inferences",
  "assumptions",
  "decisions",
  "materialOpenItems",
  "stalledRounds",
  "approval",
];

const ID_COLLECTIONS = [
  "acceptanceCriteria",
  "verificationScenarios",
  "facts",
  "inferences",
  "assumptions",
  "decisions",
  "materialOpenItems",
  "alternatives",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function approvalContent(frame) {
  if (!isRecord(frame)) {
    return frame;
  }

  const content = Object.fromEntries(
    Object.entries(frame).filter(([key]) => key !== "approval"),
  );
  if (hasOwn(content, "status")) {
    content.status = "approved";
  }
  return content;
}

export function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function computeFrameDigest(frame) {
  const canonical = canonicalize(approvalContent(frame));
  return createHash("sha256").update(canonical ?? "null").digest("hex");
}

export function validateFrame(frame) {
  const digest = computeFrameDigest(frame);
  const errors = [];
  const addError = (code, path, message) => {
    errors.push({ code, path, message });
  };

  if (!isRecord(frame)) {
    addError("FRAME_TYPE", "$", "Frame must be a JSON object.");
    return { valid: false, errors, digest };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(frame, field)) {
      addError("REQUIRED_FIELD", `$.${field}`, `Missing required field: ${field}.`);
    }
  }

  if (hasOwn(frame, "schemaVersion") && frame.schemaVersion !== "1.0.0") {
    addError(
      "SCHEMA_VERSION",
      "$.schemaVersion",
      'schemaVersion must be "1.0.0".',
    );
  }

  checkNonEmptyString(frame.requestId, "$.requestId", addError);
  checkNonEmptyString(frame.goal, "$.goal", addError);
  checkNonEmptyString(frame.observableOutcome, "$.observableOutcome", addError);
  checkEnum(frame.status, STATUS_VALUES, "$.status", addError);
  checkEnum(frame.depth, DEPTH_VALUES, "$.depth", addError);

  checkScope(frame.scope, addError);
  checkAcceptanceCriteria(frame.acceptanceCriteria, addError);
  checkNonEmptyStringArray(frame.constraints, "$.constraints", addError);
  checkVerificationScenarios(frame.verificationScenarios, addError);
  checkAuthority(frame.authority, addError);

  for (const field of ["facts", "inferences", "assumptions", "decisions", "materialOpenItems"]) {
    if (!Array.isArray(frame[field])) {
      addError("REQUIRED_FIELD", `$.${field}`, `${field} must be an array.`);
    }
  }

  for (const field of ["facts", "inferences", "assumptions", "materialOpenItems"]) {
    checkStatementItems(frame[field], field, addError);
  }
  checkDecisions(frame.decisions, addError);
  checkDuplicateIds(frame, addError);
  checkAcceptanceReferences(frame, addError);

  if (Array.isArray(frame.materialOpenItems) && frame.materialOpenItems.length > 0) {
    addError(
      "MATERIAL_OPEN",
      "$.materialOpenItems",
      "Material open items must be resolved before validation can pass.",
    );
  }

  checkStalledRounds(frame, addError);
  checkDepthRequirements(frame, addError);
  checkApproval(frame, digest, addError);

  return { valid: errors.length === 0, errors, digest };
}

function checkNonEmptyString(value, path, addError) {
  if (!isNonEmptyString(value)) {
    addError("REQUIRED_FIELD", path, `${path} must be a non-empty string.`);
  }
}

function checkEnum(value, allowed, path, addError) {
  if (!allowed.includes(value)) {
    addError(
      "INVALID_ENUM",
      path,
      `${path} must be one of: ${allowed.join(", ")}.`,
    );
  }
}

function checkNonEmptyStringArray(value, path, addError) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => !isNonEmptyString(item))
  ) {
    addError(
      "REQUIRED_FIELD",
      path,
      `${path} must be a non-empty array of non-empty strings.`,
    );
  }
}

function checkScope(scope, addError) {
  if (!isRecord(scope)) {
    addError("REQUIRED_FIELD", "$.scope", "scope must be an object.");
    return;
  }

  checkNonEmptyStringArray(scope.included, "$.scope.included", addError);
  checkNonEmptyStringArray(scope.excluded, "$.scope.excluded", addError);
}

function checkAcceptanceCriteria(criteria, addError) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    addError(
      "REQUIRED_FIELD",
      "$.acceptanceCriteria",
      "acceptanceCriteria must be a non-empty array.",
    );
    return;
  }

  criteria.forEach((criterion, index) => {
    if (!isRecord(criterion)) {
      addError(
        "REQUIRED_FIELD",
        `$.acceptanceCriteria[${index}]`,
        "Each acceptance criterion must be an object.",
      );
      return;
    }
    checkNonEmptyString(criterion.id, `$.acceptanceCriteria[${index}].id`, addError);
    checkNonEmptyString(
      criterion.statement,
      `$.acceptanceCriteria[${index}].statement`,
      addError,
    );
  });
}

function checkVerificationScenarios(scenarios, addError) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    addError(
      "REQUIRED_FIELD",
      "$.verificationScenarios",
      "verificationScenarios must be a non-empty array.",
    );
    return;
  }

  scenarios.forEach((scenario, index) => {
    const basePath = `$.verificationScenarios[${index}]`;
    if (!isRecord(scenario)) {
      addError(
        "REQUIRED_FIELD",
        basePath,
        "Each verification scenario must be an object.",
      );
      return;
    }

    checkNonEmptyString(scenario.id, `${basePath}.id`, addError);
    if (
      !Array.isArray(scenario.acceptanceCriteriaRefs) ||
      scenario.acceptanceCriteriaRefs.length === 0 ||
      scenario.acceptanceCriteriaRefs.some((reference) => !isNonEmptyString(reference))
    ) {
      addError(
        "EMPTY_VERIFICATION_FIELD",
        `${basePath}.acceptanceCriteriaRefs`,
        "acceptanceCriteriaRefs must contain at least one criterion ID.",
      );
    }
    checkEnum(scenario.actor, ACTOR_VALUES, `${basePath}.actor`, addError);
    checkEnum(scenario.surface, SURFACE_VALUES, `${basePath}.surface`, addError);

    for (const field of ["preconditions", "steps", "expected", "evidence"]) {
      const value = scenario[field];
      if (
        !Array.isArray(value) ||
        value.length === 0 ||
        value.some((item) => !isNonEmptyString(item))
      ) {
        addError(
          "EMPTY_VERIFICATION_FIELD",
          `${basePath}.${field}`,
          `${field} must contain at least one non-empty string.`,
        );
      }
    }
  });
}

function checkAuthority(authority, addError) {
  if (!isRecord(authority)) {
    addError("REQUIRED_FIELD", "$.authority", "authority must be an object.");
    return;
  }

  checkNonEmptyString(authority.decisionMaker, "$.authority.decisionMaker", addError);
  checkNonEmptyStringArray(authority.boundaries, "$.authority.boundaries", addError);
}

function checkStatementItems(items, field, addError) {
  if (!Array.isArray(items)) {
    return;
  }

  items.forEach((item, index) => {
    if (!isRecord(item)) {
      addError(
        "REQUIRED_FIELD",
        `$.${field}[${index}]`,
        `Each ${field} item must be an object.`,
      );
      return;
    }
    checkNonEmptyString(item.id, `$.${field}[${index}].id`, addError);
    checkNonEmptyString(item.statement, `$.${field}[${index}].statement`, addError);
  });
}

function checkDecisions(decisions, addError) {
  if (!Array.isArray(decisions)) {
    return;
  }

  decisions.forEach((decision, index) => {
    const basePath = `$.decisions[${index}]`;
    if (!isRecord(decision)) {
      addError("REQUIRED_FIELD", basePath, "Each decision must be an object.");
      return;
    }
    checkNonEmptyString(decision.id, `${basePath}.id`, addError);
    checkNonEmptyString(decision.statement, `${basePath}.statement`, addError);
    checkEnum(decision.materiality, MATERIALITY_VALUES, `${basePath}.materiality`, addError);
    checkEnum(decision.effect, EFFECT_VALUES, `${basePath}.effect`, addError);
    checkEnum(decision.revisability, REVISABILITY_VALUES, `${basePath}.revisability`, addError);
  });
}

function checkDuplicateIds(frame, addError) {
  const seen = new Map();

  for (const field of ID_COLLECTIONS) {
    if (!Array.isArray(frame[field])) {
      continue;
    }
    frame[field].forEach((item, index) => {
      if (!isRecord(item) || !isNonEmptyString(item.id)) {
        return;
      }
      if (seen.has(item.id)) {
        addError(
          "DUPLICATE_ID",
          `$.${field}[${index}].id`,
          `ID ${item.id} duplicates ${seen.get(item.id)}.`,
        );
      } else {
        seen.set(item.id, `$.${field}[${index}].id`);
      }
    });
  }
}

function checkAcceptanceReferences(frame, addError) {
  if (!Array.isArray(frame.acceptanceCriteria) || !Array.isArray(frame.verificationScenarios)) {
    return;
  }

  const criterionIds = new Set(
    frame.acceptanceCriteria
      .filter((criterion) => isRecord(criterion) && isNonEmptyString(criterion.id))
      .map((criterion) => criterion.id),
  );
  const coveredIds = new Set();

  frame.verificationScenarios.forEach((scenario, scenarioIndex) => {
    if (!isRecord(scenario) || !Array.isArray(scenario.acceptanceCriteriaRefs)) {
      return;
    }
    const seenReferences = new Set();
    scenario.acceptanceCriteriaRefs.forEach((reference, referenceIndex) => {
      if (seenReferences.has(reference)) {
        addError(
          "DUPLICATE_ID",
          `$.verificationScenarios[${scenarioIndex}].acceptanceCriteriaRefs[${referenceIndex}]`,
          `Acceptance criterion reference ${reference} is duplicated in this scenario.`,
        );
      } else {
        seenReferences.add(reference);
      }
      if (!criterionIds.has(reference)) {
        addError(
          "UNKNOWN_ACCEPTANCE_CRITERION",
          `$.verificationScenarios[${scenarioIndex}].acceptanceCriteriaRefs[${referenceIndex}]`,
          `Unknown acceptance criterion reference: ${reference}.`,
        );
      } else {
        coveredIds.add(reference);
      }
    });
  });

  frame.acceptanceCriteria.forEach((criterion, index) => {
    if (isRecord(criterion) && isNonEmptyString(criterion.id) && !coveredIds.has(criterion.id)) {
      addError(
        "UNVERIFIED_ACCEPTANCE_CRITERION",
        `$.acceptanceCriteria[${index}].id`,
        `Acceptance criterion ${criterion.id} has no verification scenario.`,
      );
    }
  });
}

function checkStalledRounds(frame, addError) {
  if (!Number.isInteger(frame.stalledRounds) || frame.stalledRounds < 0) {
    addError(
      "REQUIRED_FIELD",
      "$.stalledRounds",
      "stalledRounds must be a non-negative integer.",
    );
    return;
  }

  const shouldNeedDirection = frame.stalledRounds >= 2;
  const needsDirection = frame.status === "needs-user-direction";
  if (shouldNeedDirection !== needsDirection) {
    addError(
      "STALL_STATUS_MISMATCH",
      "$.status",
      "needs-user-direction status and stalledRounds >= 2 must occur together.",
    );
  }
}

function checkDepthRequirements(frame, addError) {
  const addDepthError = (path, message) => {
    addError("DEPTH_REQUIREMENT", path, message);
  };
  const requiresL2 = frame.depth === "L2" || frame.depth === "L3";
  const requiresL3 = frame.depth === "L3";

  if (requiresL2 || hasOwn(frame, "alternatives")) {
    if (!Array.isArray(frame.alternatives) || frame.alternatives.length === 0) {
      addDepthError(
        "$.alternatives",
        `alternatives must be a non-empty array${requiresL2 ? ` for ${frame.depth} frames` : ""}.`,
      );
    } else {
      frame.alternatives.forEach((alternative, index) => {
        const basePath = `$.alternatives[${index}]`;
        if (!isRecord(alternative)) {
          addDepthError(basePath, "Each alternative must be an object.");
          return;
        }
        for (const field of ["id", "option", "reason"]) {
          if (!isNonEmptyString(alternative[field])) {
            addDepthError(
              `${basePath}.${field}`,
              `${field} must be a non-empty string.`,
            );
          }
        }
      });
    }
  }

  for (const field of ["affectedPaths", "sideEffects"]) {
    if (requiresL2 || hasOwn(frame, field)) {
      if (
        !Array.isArray(frame[field]) ||
        frame[field].length === 0 ||
        frame[field].some((item) => !isNonEmptyString(item))
      ) {
        addDepthError(
          `$.${field}`,
          `${field} must contain non-empty strings${requiresL2 ? ` for ${frame.depth} frames` : ""}.`,
        );
      }
    }
  }

  if (requiresL2 || hasOwn(frame, "reversibility")) {
    if (!isRecord(frame.reversibility)) {
      addDepthError(
        "$.reversibility",
        `reversibility must be an object${requiresL2 ? ` for ${frame.depth} frames` : ""}.`,
      );
    } else {
      if (!REVISABILITY_VALUES.includes(frame.reversibility.level)) {
        addDepthError(
          "$.reversibility.level",
          `reversibility.level must be one of: ${REVISABILITY_VALUES.join(", ")}.`,
        );
      }
      if (!isNonEmptyString(frame.reversibility.cost)) {
        addDepthError(
          "$.reversibility.cost",
          "reversibility.cost must be a non-empty string.",
        );
      }
    }
  }

  if (requiresL3 || hasOwn(frame, "rollback")) {
    if (!isRecord(frame.rollback)) {
      addDepthError("$.rollback", "rollback must be an object for L3 frames.");
    } else {
      if (!isNonEmptyString(frame.rollback.strategy)) {
        addDepthError(
          "$.rollback.strategy",
          "rollback.strategy must be a non-empty string.",
        );
      }
      for (const field of ["triggers", "recoveryEvidence"]) {
        if (
          !Array.isArray(frame.rollback[field]) ||
          frame.rollback[field].length === 0 ||
          frame.rollback[field].some((item) => !isNonEmptyString(item))
        ) {
          addDepthError(
            `$.rollback.${field}`,
            `rollback.${field} must contain non-empty strings.`,
          );
        }
      }
    }
  }

  if (requiresL3 || hasOwn(frame, "riskImpact")) {
    if (!isRecord(frame.riskImpact)) {
      addDepthError("$.riskImpact", "riskImpact must be an object for L3 frames.");
    } else {
      for (const field of ["security", "data", "cost", "deployment"]) {
        if (!isNonEmptyString(frame.riskImpact[field])) {
          addDepthError(
            `$.riskImpact.${field}`,
            `riskImpact.${field} must be a non-empty string.`,
          );
        }
      }
    }
  }

  if (requiresL3 || hasOwn(frame, "independentReview")) {
    if (!isRecord(frame.independentReview)) {
      addDepthError(
        "$.independentReview",
        "independentReview must be an object for L3 frames.",
      );
    } else {
      if (typeof frame.independentReview.required !== "boolean") {
        addDepthError(
          "$.independentReview.required",
          "independentReview.required must be a boolean.",
        );
      }
      if (!isNonEmptyString(frame.independentReview.rationale)) {
        addDepthError(
          "$.independentReview.rationale",
          "independentReview.rationale must be a non-empty string.",
        );
      }
    }
  }
}

function checkApproval(frame, digest, addError) {
  const approval = frame.approval;
  if (frame.status !== "approved") {
    if (approval !== null && approval !== undefined) {
      addError(
        "APPROVAL_REQUIRED",
        "$.approval",
        "Non-approved frames must set approval to null.",
      );
    }
    return;
  }
  if (frame.status === "approved" && !isRecord(approval)) {
    addError(
      "APPROVAL_REQUIRED",
      "$.approval",
      "Approved frames require approval metadata.",
    );
    return;
  }
  if (approval === null || approval === undefined) {
    return;
  }
  if (!isRecord(approval)) {
    addError("APPROVAL_REQUIRED", "$.approval", "approval must be an object or null.");
    return;
  }

  if (approval.approvedBy !== "user") {
    addError(
      "APPROVAL_ACTOR",
      "$.approval.approvedBy",
      'approvedBy must be "user".',
    );
  }
  checkNonEmptyString(approval.approvedAt, "$.approval.approvedAt", addError);
  checkNonEmptyString(approval.frameDigest, "$.approval.frameDigest", addError);
  if (isNonEmptyString(approval.frameDigest) && approval.frameDigest !== digest) {
    addError(
      "DIGEST_MISMATCH",
      "$.approval.frameDigest",
      "approval.frameDigest does not match the current Frame content.",
    );
  }
}
