#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { validateFrame } from "./frame-contract.mjs";

function emit(result) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv.length !== 3) {
  emit({
    valid: false,
    errors: [
      {
        code: "USAGE_ERROR",
        path: "$",
        message: "Usage: validate-frame.mjs <frame.json>",
      },
    ],
    digest: null,
  });
  process.exitCode = 2;
} else {
  const framePath = process.argv[2];
  let source;

  try {
    source = await readFile(framePath, "utf8");
  } catch (error) {
    emit({
      valid: false,
      errors: [
        {
          code: "READ_ERROR",
          path: "$",
          message: `Unable to read frame: ${error.message}`,
        },
      ],
      digest: null,
    });
    process.exitCode = 2;
  }

  if (source !== undefined) {
    let frame;
    try {
      frame = JSON.parse(source);
    } catch (error) {
      emit({
        valid: false,
        errors: [
          {
            code: "JSON_PARSE_ERROR",
            path: "$",
            message: `Unable to parse frame JSON: ${error.message}`,
          },
        ],
        digest: null,
      });
      process.exitCode = 2;
    }

    if (frame !== undefined) {
      const result = validateFrame(frame);
      emit(result);
      process.exitCode = result.valid ? 0 : 1;
    }
  }
}
