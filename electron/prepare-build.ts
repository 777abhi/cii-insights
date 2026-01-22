import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ELECTRON_ROOT = __dirname;
const CLIENT_BUILD_SRC = path.join(__dirname, '../../client/dist'); // Adjusted for dist/prepare-build.js location
const CLIENT_BUILD_DEST = path.join(__dirname, '../client-build'); // Adjusted for dist/ location
const SERVER_BUILD_SRC = path.join(__dirname, '../../server/dist');
const SERVER_DEST = path.join(__dirname, '../server-build');
const SERVER_PACKAGE_JSON = path.join(__dirname, '../../server/package.json');

function cleanDir(dir: string) {
    if (fs.existsSync(dir)) {
        console.log(`Cleaning ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyDir(src: string, dest: string, filterFn?: (name: string, path: string) => boolean) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (filterFn && !filterFn(entry.name, srcPath)) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, filterFn);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('--- Preparing Electron Build ---');

// 1. Clean previous builds
cleanDir(CLIENT_BUILD_DEST);
cleanDir(SERVER_DEST);

// 2. Copy Client Build
if (!fs.existsSync(CLIENT_BUILD_SRC)) {
    console.error(`Error: Client build not found at ${CLIENT_BUILD_SRC}. Run 'npm run build' in client folder first.`);
    process.exit(1);
}
console.log('Copying Client build...');
copyDir(CLIENT_BUILD_SRC, CLIENT_BUILD_DEST);

// 3. Copy Server Build (from server/dist)
if (!fs.existsSync(SERVER_BUILD_SRC)) {
    console.error(`Error: Server build not found at ${SERVER_BUILD_SRC}. Run 'npm run build' in server folder first.`);
    process.exit(1);
}
console.log('Copying Server build...');
copyDir(SERVER_BUILD_SRC, SERVER_DEST);

// Copy package.json to server-build so we can install dependencies
fs.copyFileSync(SERVER_PACKAGE_JSON, path.join(SERVER_DEST, 'package.json'));

// 4. Install Server Production Dependencies
console.log('Installing Server dependencies...');
try {
    execSync('npm install --production', { cwd: SERVER_DEST, stdio: 'inherit' });
} catch (e) {
    console.error('Failed to install server dependencies');
    process.exit(1);
}

console.log('--- Preparation Complete ---');
