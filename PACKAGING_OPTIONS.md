# Packaging and Sharing Options

This document outlines the options available for packaging and sharing the GitHub Analytics Dashboard.

## 1. Browser App (Docker)

The most robust way to share the application as a self-hosted browser app is using Docker. This ensures that all dependencies (including `git` and Node.js) are correctly installed.

### Prerequisites
- Docker and Docker Compose installed on the host machine.

### How to Run
1. Navigate to the project root.
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
3. Open your browser to [http://localhost:8080](http://localhost:8080).

This setup includes:
- **Backend:** Node.js server running on port 3001 (internal).
- **Frontend:** Nginx server serving the React app on port 80 (mapped to 8080 on host) and proxying API requests to the backend.

## 2. Desktop App (Electron)

The application can be run as a native desktop application on Windows, macOS, or Linux using Electron.

### Prerequisites
- Node.js and npm installed on the host machine.
- Git installed on the host machine (required by the backend).

### How to Run (Development/Local)
1. **Build the Frontend:**
   The Electron app loads the built static files. You must build the React app first.
   **Important:** You must set the `VITE_API_URL` to `http://localhost:3001` so the frontend knows where to find the backend (since Electron doesn't use the Nginx proxy).
   ```bash
   cd client
   # On Windows (cmd)
   set VITE_API_URL=http://localhost:3001 && npm install && npm run build
   # On Mac/Linux
   VITE_API_URL=http://localhost:3001 npm install && npm run build
   ```

2. **Run Electron:**
   ```bash
   cd ../electron
   npm install
   npm start
   ```

This will launch a desktop window containing the application. It automatically spawns the backend server in the background.

### Packaging for Distribution
To create an executable (e.g., `.exe` or `.dmg`), you would typically use `electron-builder`.
1. Install electron-builder: `npm install --save-dev electron-builder` in the `electron` directory.
2. Add a `build` script to `electron/package.json`.
3. Run `npm run build`.

## 3. Mobile App (Progressive Web App - PWA)

The application is configured as a PWA. This means if you host the "Browser App" (via Docker or otherwise) and access it from a mobile browser:
1. You can verify it works on mobile (responsive design).
2. You can tap "Add to Home Screen" in your browser menu.
3. It will install as a standalone app on your device.

**Note:** The backend still runs on the server. The mobile app interacts with the remote backend.
