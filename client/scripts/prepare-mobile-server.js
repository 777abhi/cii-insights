const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serverDir = path.resolve(__dirname, '../../server');
const androidAssetsDir = path.resolve(__dirname, '../android/app/src/main/assets');
const nodeProjectDir = path.join(androidAssetsDir, 'nodejs-project');

console.log('Preparing mobile server...');
console.log(`Source: ${serverDir}`);
console.log(`Destination: ${nodeProjectDir}`);

if (!fs.existsSync(androidAssetsDir)) {
    console.log('Creating assets directory...');
    fs.mkdirSync(androidAssetsDir, { recursive: true });
}

if (fs.existsSync(nodeProjectDir)) {
    console.log('Cleaning existing nodejs-project...');
    fs.rmSync(nodeProjectDir, { recursive: true, force: true });
}

fs.mkdirSync(nodeProjectDir, { recursive: true });

console.log('Copying server files...');
// Read all files in server dir and copy them, excluding node_modules, .git, repos
const files = fs.readdirSync(serverDir);
const ignoreList = ['node_modules', '.git', 'repos', 'Dockerfile', '.gitignore', 'package-lock.json']; // We can regenerate lock or copy it. Let's copy it if exists.

files.forEach(file => {
    if (ignoreList.includes(file)) return;

    const src = path.join(serverDir, file);
    const dest = path.join(nodeProjectDir, file);
    const stat = fs.statSync(src);

    if (stat.isFile()) {
        fs.copyFileSync(src, dest);
    } else if (stat.isDirectory()) {
        // Recursive copy if needed? Currently we don't have subdirs except repos (ignored).
        // If we add subdirs later, we might need this.
        // For now, git-service.js and index.js are in root.
    }
});

// Explicitly copy package-lock.json if it exists to ensure versions
if (fs.existsSync(path.join(serverDir, 'package-lock.json'))) {
    fs.copyFileSync(path.join(serverDir, 'package-lock.json'), path.join(nodeProjectDir, 'package-lock.json'));
}

console.log('Installing production dependencies...');
try {
    execSync('npm install --production --no-bin-links', { cwd: nodeProjectDir, stdio: 'inherit' });
} catch (e) {
    console.error('Failed to install dependencies:', e);
    process.exit(1);
}

console.log('Mobile server prepared successfully.');
