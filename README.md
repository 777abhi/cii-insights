# QE Analytics Dashboard

A lightweight, interactive, modern analytics dashboard designed to synthesize and visualize Quality Engineering (QE) metrics from Git repositories.

![Dashboard Overview](docs/images/dashboard.png)

## Overview

This application allows engineering teams to gain real-time insights into their development patterns, velocity, and code quality by analyzing Git history. Simply provide a repository URL and branch, and the dashboard will visualize key performance indicators.

## Features

### 📊 Dashboard Metrics
- **Velocity**: Track commit volume over time to understand team cadence.
- **Quality Score**: Analyze adherence to [Conventional Commits](https://www.conventionalcommits.org/).
- **Code Churn**: Measure Lines Added vs. Deleted to spot refactoring or rapid growth.
- **Hotspots**: Identify frequently modified files ("God Classes") that may need attention.
- **Commit Types**: Breakdown of effort (Features vs. Fixes vs. Chores).

### 👥 Top Authors
Analyze individual contributor performance and patterns.
- **Top Contributors**: Ranked list by commit count and code impact.
- **Monthly Activity**: Visualizing author contributions over time.

![Top Authors](docs/images/top_authors.png)

### 📂 Repository Management
Manage your local workspace directly from the app.
- **List Repos**: View all repositories cloned by the application.
- **Cleanup**: Delete specific or all repositories to free up disk space.

![Manage Repos](docs/images/manage_repos.png)

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   Git

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    # Root
    npm install

    # Backend
    cd server && npm install

    # Frontend
    cd ../client && npm install
    ```

### Running the App

1.  Start both server and client with a single command:
    ```bash
    npm run dev
    ```
2.  Open `http://localhost:5173` (or the port shown in terminal) in your browser.

### Security
This project uses `npm audit` to ensure dependency security. Run `npm audit fix` if vulnerabilities are reported.
