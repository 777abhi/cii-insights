"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const network_1 = require("./utils/network");
const repoRoutes_1 = __importDefault(require("./routes/repoRoutes"));
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api', repoRoutes_1.default);
app.listen(PORT, () => {
    const ip = (0, network_1.getLocalIpAddress)();
    console.log(`Server running on port ${PORT}`);
    console.log(`To connect from Android, use API Base URL: http://${ip}:${PORT}`);
});
