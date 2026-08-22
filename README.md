# Codex Maintainer Kit

Codex Maintainer Kit is a lightweight open-source CLI and GitHub Action for maintainers who need faster issue triage, pull request review checklists, and release note drafts.

The project is intentionally small and transparent. It gives maintainers useful automation without requiring a hosted service or sending repository data anywhere.

## Features

- Issue triage suggestions with labels, priority, and next action
- Custom label rules with `maintainer-kit.config.json`
- Pull request review checklists based on changed files
- Release note drafts from conventional commit messages
- Zero runtime dependencies
- GitHub Action-ready entrypoint

## Quickstart

```bash
npm install
npm run triage
npm run review
npm run release
```

Run directly:

```bash
node ./bin/codex-maintainer-kit.js triage --file examples/issue.json
node ./bin/codex-maintainer-kit.js review --file examples/pr.json
node ./bin/codex-maintainer-kit.js release --file examples/commits.txt
```

Use custom label rules:

```bash
node ./bin/codex-maintainer-kit.js triage --file examples/issue.json --config examples/maintainer-kit.config.json
```

Example config:

```json
{
  "labelRules": [
    {
      "label": "ci",
      "terms": ["ci", "workflow", "actions"]
    },
    {
      "label": "flaky",
      "terms": ["flaky", "unstable", "intermittent"]
    }
  ]
}
```

## Example Output

```md
# Triage: Crash when issue body is empty

## Summary
- Suggested labels: bug
- Suggested priority: medium
- Next action: ask for reproduction details if missing

## Checklist
- [ ] Confirm expected behavior.
- [ ] Confirm actual behavior.
- [ ] Request a minimal reproduction when needed.
- [ ] Link related issues or prior fixes.
- [ ] Decide whether this blocks the next release.
```

## GitHub Action Usage

```yaml
name: Maintainer automation

on:
  issues:
    types: [opened, edited]
  pull_request:
    types: [opened, synchronize]

jobs:
  maintainer-kit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm test
```

## Roadmap

- Add GitHub API integration for posting triage comments
- Improve configurable label rules
- Add repository-specific maintainer policies
- Add optional OpenAI-powered summaries
- Add SARIF output for security-sensitive review notes

## Why This Exists

Open-source maintenance includes a lot of invisible work: reviewing pull requests, asking for reproductions, preparing releases, keeping issues organized, and protecting quality over time. This project helps maintainers make that work repeatable.

## Contributing

Contributions are welcome. Good first areas:

- Add more label rules
- Improve release note grouping
- Add fixtures for real-world issue formats
- Improve GitHub Action examples

Please keep the project dependency-light and easy to audit.
