"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class FSController {
    list(req, res) {
        const currentPath = req.query.path || os_1.default.homedir();
        try {
            if (!fs_1.default.existsSync(currentPath)) {
                return res.status(404).json({ error: 'Path not found' });
            }
            const stats = fs_1.default.statSync(currentPath);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Path is not a directory' });
            }
            const entries = fs_1.default.readdirSync(currentPath, { withFileTypes: true })
                .map(entry => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
                path: path_1.default.join(currentPath, entry.name)
            }))
                .sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });
            const parent = path_1.default.dirname(currentPath);
            res.json({
                path: currentPath,
                parent: parent !== currentPath ? parent : null,
                entries
            });
        }
        catch (error) {
            console.error('Error listing directory:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new FSController();
