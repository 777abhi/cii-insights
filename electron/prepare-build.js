const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ELECTRON_ROOT = __dirname;
const CLIENT_BUILD_SRC = path.join(__dirname, '../client/dist');
const CLIENT_BUILD_DEST = path.join(__dirname, 'client-build');
const SERVER_SRC = path.join(__dirname, '../server');
const SERVER_DEST = path.join(__dirname, 'server-build');

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        console.log(`Cleaning ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyDir(src, dest, filterFn) {
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

// 3. Copy Server
console.log('Copying Server...');
copyDir(SERVER_SRC, SERVER_DEST, (name, fullpath) => {
    // Exclude node_modules and .git
    if (name === 'node_modules' || name === '.git' || name === 'repos') return false;
    return true;
});

// 4. Install Server Production Dependencies
console.log('Installing Server dependencies...');
try {
    execSync('npm install --production', { cwd: SERVER_DEST, stdio: 'inherit' });
} catch (e) {
    console.error('Failed to install server dependencies');
    process.exit(1);
}

console.log('--- Preparation Complete ---');
