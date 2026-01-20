"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalIpAddress = getLocalIpAddress;
const os_1 = __importDefault(require("os"));
function getLocalIpAddress() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (ifaces) {
            for (const iface of ifaces) {
                // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}
