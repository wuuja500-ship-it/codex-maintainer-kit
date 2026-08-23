#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  buildReleaseNotes,
  buildReviewChecklist,
  classifyIssue,
  formatMarkdownReport
} from "../src/index.js";
import { listGitHubIssues, listGitHubPullRequests } from "../src/github.js";

const USAGE = `
codex-maintainer-kit

Usage:
  cmk triage --file issue.json
  cmk triage --file issue.json --config maintainer-kit.config.json
  cmk review --file pr.json
  cmk release --file commits.txt
  cmk github --repo owner/name --resource issues [--state open] [--limit 10]
  cmk github --repo owner/name --resource pulls [--state open] [--limit 10]

Commands:
  triage   Classify an issue and suggest labels, priority, and next action.
  review   Generate a maintainer review checklist for a pull request.
  release  Turn commit messages into grouped release notes.
  github   Read GitHub issues or pull requests and generate maintainer reports.
`;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const fileIndex = rest.indexOf("--file");
  const configIndex = rest.indexOf("--config");
  const file = fileIndex >= 0 ? rest[fileIndex + 1] : undefined;
  const config = configIndex >= 0 ? rest[configIndex + 1] : undefined;
  const repoIndex = rest.indexOf("--repo");
  const resourceIndex = rest.indexOf("--resource");
  const stateIndex = rest.indexOf("--state");
  const limitIndex = rest.indexOf("--limit");
  const tokenEnvIndex = rest.indexOf("--token-env");
  return {
    command,
    config,
    file,
    repo: repoIndex >= 0 ? rest[repoIndex + 1] : undefined,
    resource: resourceIndex >= 0 ? rest[resourceIndex + 1] : undefined,
    state: stateIndex >= 0 ? rest[stateIndex + 1] : "open",
    limit: limitIndex >= 0 ? rest[limitIndex + 1] : 10,
    tokenEnv: tokenEnvIndex >= 0 ? rest[tokenEnvIndex + 1] : "GITHUB_TOKEN"
  };
}

async function readInput(file) {
  if (!file) {
    throw new Error("Missing --file input.");
  }
  return readFile(file, "utf8");
}

async function main() {
  const { command, config, file, repo, resource, state, limit, tokenEnv } = parseArgs(process.argv.slice(2));

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE.trim());
    return;
  }

  let report;

  if (command === "triage") {
    const input = await readInput(file);
    const configInput = config ? JSON.parse(await readFile(config, "utf8")) : {};
    report = classifyIssue(JSON.parse(input), { config: configInput });
  } else if (command === "review") {
    const input = await readInput(file);
    report = buildReviewChecklist(JSON.parse(input));
  } else if (command === "release") {
    const input = await readInput(file);
    report = buildReleaseNotes(input, basename(file));
  } else if (command === "github") {
    if (!repo || !resource) {
      throw new Error("GitHub command requires --repo owner/name and --resource issues|pulls.");
    }

    const token = process.env[tokenEnv];
    if (resource === "issues") {
      const issues = await listGitHubIssues(repo, { token, state, limit });
      report = {
        title: `GitHub issues: ${repo}`,
        summary: [`Issues loaded: ${issues.length}`, `State: ${state}`],
        sections: Object.fromEntries(issues.map((issue) => [
          `#${issue.number} ${issue.title}`,
          classifyIssue(issue).summary.concat([`URL: ${issue.url}`])
        ]))
      };
    } else if (resource === "pulls") {
      const pulls = await listGitHubPullRequests(repo, { token, state, limit });
      report = {
        title: `GitHub pull requests: ${repo}`,
        summary: [`Pull requests loaded: ${pulls.length}`, `State: ${state}`],
        sections: Object.fromEntries(pulls.map((pull) => [
          `#${pull.number} ${pull.title}`,
          buildReviewChecklist(pull).summary.concat([`URL: ${pull.url}`])
        ]))
      };
    } else {
      throw new Error("GitHub resource must be issues or pulls.");
    }
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  console.log(formatMarkdownReport(report));
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
