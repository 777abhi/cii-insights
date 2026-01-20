"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const ELECTRON_ROOT = __dirname;
const CLIENT_BUILD_SRC = path_1.default.join(__dirname, '../../client/dist'); // Adjusted for dist/prepare-build.js location
const CLIENT_BUILD_DEST = path_1.default.join(__dirname, '../client-build'); // Adjusted for dist/ location
const SERVER_BUILD_SRC = path_1.default.join(__dirname, '../../server/dist');
const SERVER_DEST = path_1.default.join(__dirname, '../server-build');
const SERVER_PACKAGE_JSON = path_1.default.join(__dirname, '../../server/package.json');
function cleanDir(dir) {
    if (fs_1.default.existsSync(dir)) {
        console.log(`Cleaning ${dir}...`);
        fs_1.default.rmSync(dir, { recursive: true, force: true });
    }
}
function copyDir(src, dest, filterFn) {
    if (!fs_1.default.existsSync(dest)) {
        fs_1.default.mkdirSync(dest, { recursive: true });
    }
    const entries = fs_1.default.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (filterFn && !filterFn(entry.name, srcPath)) {
            continue;
        }
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, filterFn);
        }
        else {
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
console.log('--- Preparing Electron Build ---');
// 1. Clean previous builds
cleanDir(CLIENT_BUILD_DEST);
cleanDir(SERVER_DEST);
// 2. Copy Client Build
if (!fs_1.default.existsSync(CLIENT_BUILD_SRC)) {
    console.error(`Error: Client build not found at ${CLIENT_BUILD_SRC}. Run 'npm run build' in client folder first.`);
    process.exit(1);
}
console.log('Copying Client build...');
copyDir(CLIENT_BUILD_SRC, CLIENT_BUILD_DEST);
// 3. Copy Server Build (from server/dist)
if (!fs_1.default.existsSync(SERVER_BUILD_SRC)) {
    console.error(`Error: Server build not found at ${SERVER_BUILD_SRC}. Run 'npm run build' in server folder first.`);
    process.exit(1);
}
console.log('Copying Server build...');
copyDir(SERVER_BUILD_SRC, SERVER_DEST);
// Copy package.json to server-build so we can install dependencies
fs_1.default.copyFileSync(SERVER_PACKAGE_JSON, path_1.default.join(SERVER_DEST, 'package.json'));
// 4. Install Server Production Dependencies
console.log('Installing Server dependencies...');
try {
    (0, child_process_1.execSync)('npm install --production', { cwd: SERVER_DEST, stdio: 'inherit' });
}
catch (e) {
    console.error('Failed to install server dependencies');
    process.exit(1);
}
console.log('--- Preparation Complete ---');
