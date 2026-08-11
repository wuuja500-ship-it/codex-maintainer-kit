# GitHub Repository Setup

Use these values when creating the GitHub repository.

## Repository Name

codex-maintainer-kit

## Description

CLI and GitHub Action for open-source issue triage, PR review checklists, and release notes.

## Website

Leave blank for now, or add the npm package URL after publishing.

## Topics

open-source, maintainer, github-action, triage, release-notes, pull-request, cli, codex

## Visibility

Public

## Recommended Settings

- Enable Issues
- Enable Discussions if you want feedback from users
- Enable Actions
- Add MIT license
- Require pull request reviews later, after the project has contributors

## First Issues To Create

### Add configurable label rules

Allow maintainers to define custom label rules in a `maintainer-kit.config.json` file.

Labels: enhancement, good first issue

### Add GitHub API integration

Support reading issue and pull request metadata directly from GitHub instead of requiring local JSON files.

Labels: enhancement

### Add repository policy checks

Let maintainers define project-specific review requirements, such as docs required for public API changes.

Labels: enhancement

### Add more release note formats

Support Markdown, JSON, and GitHub release draft output.

Labels: good first issue, docs

## First Release

Tag: v0.1.0

Title: Initial maintainer workflow prototype

Release notes:

```md
## Highlights

- Added issue triage suggestions for labels, priority, and next action.
- Added pull request review checklist generation.
- Added release note drafting from conventional commits.
- Added Node.js test coverage and GitHub Actions CI.
- Added issue templates for bug reports and feature requests.

## Notes

This is an early prototype focused on transparent, dependency-light maintainer workflows. Future releases will add GitHub API integration and configurable repository policies.
```

## Suggested Repo Pinned Intro

Codex Maintainer Kit helps open-source maintainers turn repetitive work into repeatable workflows: issue triage, PR review preparation, and release note drafting.
