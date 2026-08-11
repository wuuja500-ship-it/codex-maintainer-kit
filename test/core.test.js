import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReleaseNotes,
  buildReviewChecklist,
  classifyIssue
} from "../src/index.js";

test("classifies security issues as high priority", () => {
  const result = classifyIssue({
    title: "Security issue with leaked token",
    body: "A token may appear in logs."
  });

  assert.equal(result.summary.some((line) => line.includes("security")), true);
  assert.equal(result.summary.some((line) => line.includes("high")), true);
});

test("flags risky pull request files", () => {
  const result = buildReviewChecklist({
    title: "Add auth middleware",
    files: ["src/auth/session.js", "README.md"]
  });

  assert.equal(result.summary.some((line) => line.includes("elevated")), true);
});

test("groups conventional commits into release sections", () => {
  const result = buildReleaseNotes("feat: add labels\nfix: handle empty body\ndocs: update readme");

  assert.equal(result.sections.Features.length, 1);
  assert.equal(result.sections.Fixes.length, 1);
  assert.equal(result.sections.Documentation.length, 1);
});
