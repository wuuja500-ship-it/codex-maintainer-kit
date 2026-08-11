#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  buildReleaseNotes,
  buildReviewChecklist,
  classifyIssue,
  formatMarkdownReport
} from "../src/index.js";

const USAGE = `
codex-maintainer-kit

Usage:
  cmk triage --file issue.json
  cmk review --file pr.json
  cmk release --file commits.txt

Commands:
  triage   Classify an issue and suggest labels, priority, and next action.
  review   Generate a maintainer review checklist for a pull request.
  release  Turn commit messages into grouped release notes.
`;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const fileIndex = rest.indexOf("--file");
  const file = fileIndex >= 0 ? rest[fileIndex + 1] : undefined;
  return { command, file };
}

async function readInput(file) {
  if (!file) {
    throw new Error("Missing --file input.");
  }
  return readFile(file, "utf8");
}

async function main() {
  const { command, file } = parseArgs(process.argv.slice(2));

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE.trim());
    return;
  }

  const input = await readInput(file);
  let report;

  if (command === "triage") {
    report = classifyIssue(JSON.parse(input));
  } else if (command === "review") {
    report = buildReviewChecklist(JSON.parse(input));
  } else if (command === "release") {
    report = buildReleaseNotes(input, basename(file));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  console.log(formatMarkdownReport(report));
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
