export const DEFAULT_LABEL_RULES = [
  { label: "bug", terms: ["bug", "crash", "error", "fail", "broken", "regression", "exception"] },
  { label: "security", terms: ["security", "vulnerability", "xss", "csrf", "injection", "secret", "token"] },
  { label: "docs", terms: ["docs", "documentation", "readme", "guide", "typo"] },
  { label: "enhancement", terms: ["feature", "request", "support", "improve", "enhancement"] },
  { label: "good first issue", terms: ["small", "simple", "beginner", "first issue"] }
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function unique(values) {
  return [...new Set(values)];
}

export function resolveLabelRules(config = {}) {
  const customRules = Array.isArray(config.labelRules) ? config.labelRules : [];
  const validCustomRules = customRules.filter((rule) =>
    typeof rule?.label === "string" &&
    Array.isArray(rule.terms) &&
    rule.terms.every((term) => typeof term === "string")
  );

  return [...DEFAULT_LABEL_RULES, ...validCustomRules];
}

export function classifyIssue(issue, options = {}) {
  const title = issue.title || "Untitled issue";
  const body = issue.body || "";
  const text = normalize(`${title}\n${body}`);
  const labelRules = resolveLabelRules(options.config);
  const labels = labelRules
    .filter((rule) => rule.terms.some((term) => text.includes(term)))
    .map((rule) => rule.label);

  const priority = text.includes("security") || text.includes("data loss")
    ? "high"
    : text.includes("crash") || text.includes("regression")
      ? "medium"
      : "normal";

  return {
    title: `Triage: ${title}`,
    summary: [
      `Suggested labels: ${unique(labels).join(", ") || "needs-triage"}`,
      `Suggested priority: ${priority}`,
      `Next action: ${priority === "high" ? "assign a maintainer today" : "ask for reproduction details if missing"}`
    ],
    checklist: [
      "Confirm expected behavior.",
      "Confirm actual behavior.",
      "Request a minimal reproduction when needed.",
      "Link related issues or prior fixes.",
      "Decide whether this blocks the next release."
    ]
  };
}

export function buildReviewChecklist(pr) {
  const files = Array.isArray(pr.files) ? pr.files : [];
  const riskyAreas = files.filter((file) =>
    /auth|crypto|payment|migration|schema|security|permission/i.test(file)
  );

  return {
    title: `Review checklist: ${pr.title || "Untitled PR"}`,
    summary: [
      `Changed files: ${files.length}`,
      `Risk signal: ${riskyAreas.length > 0 ? "elevated" : "standard"}`,
      `Recommended reviewer focus: ${riskyAreas.length > 0 ? riskyAreas.join(", ") : "tests, edge cases, and docs"}`
    ],
    checklist: [
      "Does the implementation match the issue or design intent?",
      "Are error paths and empty states handled?",
      "Are tests updated for changed behavior?",
      "Are docs, examples, or migration notes needed?",
      "Is the change small enough to review confidently?"
    ]
  };
}

export function buildReleaseNotes(commitText, sourceName = "commits") {
  const lines = commitText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const groups = {
    Features: lines.filter((line) => /^feat(\(.+\))?:/i.test(line)),
    Fixes: lines.filter((line) => /^fix(\(.+\))?:/i.test(line)),
    Documentation: lines.filter((line) => /^docs(\(.+\))?:/i.test(line)),
    Maintenance: lines.filter((line) => !/^(feat|fix|docs)(\(.+\))?:/i.test(line))
  };

  return {
    title: `Release notes from ${sourceName}`,
    summary: [`Commits processed: ${lines.length}`],
    sections: groups
  };
}

export function formatMarkdownReport(report) {
  const parts = [`# ${report.title}`];

  if (report.summary?.length) {
    parts.push("", "## Summary", ...report.summary.map((line) => `- ${line}`));
  }

  if (report.checklist?.length) {
    parts.push("", "## Checklist", ...report.checklist.map((line) => `- [ ] ${line}`));
  }

  if (report.sections) {
    for (const [heading, lines] of Object.entries(report.sections)) {
      if (lines.length) {
        parts.push("", `## ${heading}`, ...lines.map((line) => `- ${line}`));
      }
    }
  }

  return parts.join("\n");
}
