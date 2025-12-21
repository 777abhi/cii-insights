# CII Insights

This repository is a small playground for exploring Continuous Integration and Delivery (CI/CD) health signals using GitHub data. It packages a few Playwright-based scripts that call the GitHub API to pull workflow run metadata and derive quick analytics.

## Business context

Engineering teams often struggle to spot early warning signs in their delivery pipelines. By looking at GitHub Actions data (e.g., workflow run durations, committers, and throughput), teams can answer questions like:

- How long do CI runs typically take, and what does the 90th percentile look like day to day?
- Which contributors are committing to the codebase each month, and how many unique engineers are pushing changes?
- Are there trends that suggest rising CI latency, instability, or uneven contributor engagement?

The scripts in this repo illustrate how to programmatically surface those signals so product and engineering leaders can track delivery velocity, identify operational risk, and prioritize CI improvements.

## What’s included

- **GitHub Actions analytics sample (`tests/example.spec.ts`)**: Uses Octokit to fetch workflow runs, then computes per-day percentile timings and per-month unique committer counts.
- **UI automation examples (`tests-examples/`)**: Standard Playwright TodoMVC specs for reference on test structure and assertions.

## Quick start

1. Install dependencies (Node 18+ recommended):
   ```bash
   npm install
   ```
2. Add your GitHub personal access token in `tests/example.spec.ts` (replace the placeholder `auth` value) and set the `owner`/`repo` variables for the repository you want to analyze.
3. Run the sample analytics script with Playwright:
   ```bash
   npx playwright test tests/example.spec.ts
   ```

The output will print unique monthly committer counts and 90th percentile workflow run durations by day.

## Notes

- The repo is intended for experimentation; adjust queries and aggregations to match your organization’s CI/CD questions.
- For production use, remember to secure secrets, handle pagination beyond the default 100 runs, and persist results to your analytics stack.
