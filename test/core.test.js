import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReleaseNotes,
  buildReviewChecklist,
  classifyIssue,
  resolveLabelRules
} from "../src/index.js";
import { listGitHubIssues } from "../src/github.js";

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

test("adds custom label rules from config", () => {
  const result = classifyIssue(
    {
      title: "Flaky test in CI",
      body: "The workflow is unstable when the network is slow."
    },
    {
      config: {
        labelRules: [
          { label: "ci", terms: ["ci", "workflow"] },
          { label: "flaky", terms: ["flaky", "unstable"] }
        ]
      }
    }
  );

  assert.equal(result.summary.some((line) => line.includes("ci")), true);
  assert.equal(result.summary.some((line) => line.includes("flaky")), true);
});

test("ignores invalid custom label rules", () => {
  const rules = resolveLabelRules({
    labelRules: [
      { label: "valid", terms: ["ok"] },
      { label: "invalid" },
      { terms: ["missing label"] }
    ]
  });

  assert.equal(rules.some((rule) => rule.label === "valid"), true);
  assert.equal(rules.some((rule) => rule.label === "invalid"), false);
});

test("loads GitHub issues without pull requests", async () => {
  const result = await listGitHubIssues("owner/repo", {
    fetchImpl: async (url) => ({
      ok: true,
      json: async () => [
        { number: 1, title: "Bug", body: "Crash", html_url: "https://github.com/owner/repo/issues/1", user: { login: "maintainer" }, labels: [{ name: "bug" }] },
        { number: 2, title: "PR", pull_request: {}, body: "", html_url: "https://github.com/owner/repo/pull/2", user: { login: "contributor" }, labels: [] }
      ]
    })
  });

  assert.match(result[0].url, /issues\/1$/);
  assert.equal(result.length, 1);
  assert.equal(result[0].labels[0], "bug");
});

test("rejects invalid GitHub repository names", async () => {
  await assert.rejects(
    () => listGitHubIssues("invalid-repository", { fetchImpl: fetch }),
    /owner\/name format/
  );
});
