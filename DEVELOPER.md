# Developer Guide

Thank you for your interest in contributing to the QE Analytics Dashboard! This guide provides instructions on how to set up your local development environment, run the application, and package it for different platforms.

## Local Development Setup

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

## Packaging and Build Options

This project supports multiple platforms. Below are the instructions for building and running each version.

### 1. Browser App (Docker)

The application can be containerized using Docker.

**Prerequisites:** Docker and Docker Compose.

**Run:**
```bash
docker-compose up --build
```
Access at [http://localhost:8080](http://localhost:8080).

### 2. Desktop App (Electron)

**Prerequisites:** Node.js, npm, Git.

**Development:**
1.  Build Frontend:
    The Electron app loads the built static files. You must build the React app first.
    **Important:** You must set the `VITE_API_URL` to `http://localhost:3001` so the frontend knows where to find the backend.
    ```bash
    cd client
    # On Windows (cmd)
    set VITE_API_URL=http://localhost:3001 && npm install && npm run build
    # On Mac/Linux
    VITE_API_URL=http://localhost:3001 npm install && npm run build
    ```
2.  Run Electron:
    ```bash
    cd ../electron
    npm install
    npm start
    ```

**Packaging:**
To create an executable (e.g., `.exe` or `.dmg`), you would typically use `electron-builder`.
1.  Install electron-builder in `electron` directory: `npm install --save-dev electron-builder`
2.  Add a `build` script to `electron/package.json`.
3.  Run `npm run build` (ensure build script is configured in `electron/package.json`).

### 3. Mobile App (PWA)

The frontend is configured as a PWA. Hosting the web app allows mobile users to "Add to Home Screen" for a native-like experience.

### 4. Android App (Capacitor)

**Prerequisites:** Node.js, Android Studio.

**Build:**
1.  Build Frontend:
    ```bash
    cd client && npm install && npm run build
    ```
2.  Sync Android:
    ```bash
    npx cap sync android
    ```
3.  Open/Build in Android Studio:
    ```bash
    npx cap open android
    # Or
    cd android && ./gradlew assembleDebug
    ```

## Security
Run `npm audit` to check for vulnerabilities.
