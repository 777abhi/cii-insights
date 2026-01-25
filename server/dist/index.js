"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const network_1 = require("./utils/network");
const repoRoutes_1 = __importDefault(require("./routes/repoRoutes"));
const stream_1 = require("stream");
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Git CORS Proxy
app.use('/git-proxy', async (req, res) => {
    let urlStr = req.url;
    // Fix normalization of // -> / by proxies
    if (urlStr.startsWith('/https:/') && !urlStr.startsWith('/https://')) {
        urlStr = urlStr.replace('/https:/', '/https://');
    }
    if (urlStr.startsWith('/http:/') && !urlStr.startsWith('/http://')) {
        urlStr = urlStr.replace('/http:/', '/http://');
    }
    // Remove leading slash to get the target URL
    const targetUrl = urlStr.substring(1);
    if (!targetUrl.startsWith('http')) {
        res.status(400).send('Invalid URL: Target URL must start with http or https');
        return;
    }
    try {
        // Filter headers
        const headers = {};
        for (const [key, value] of Object.entries(req.headers)) {
            // Skip headers that shouldn't be forwarded or are handled by fetch automatically
            if (key !== 'host' && key !== 'content-length' && key !== 'connection' && key !== 'cookie') {
                if (Array.isArray(value)) {
                    headers[key] = value.join(', ');
                }
                else if (value) {
                    headers[key] = value;
                }
            }
        }
        const fetchOptions = {
            method: req.method,
            headers: headers,
            // @ts-ignore - req is a stream, fetch supports it in Node
            body: (req.method !== 'GET' && req.method !== 'HEAD') ? req : undefined,
            // @ts-ignore - duplex is required for streaming bodies in Node fetch
            duplex: 'half'
        };
        const response = await fetch(targetUrl, fetchOptions);
        // Forward status
        res.status(response.status);
        // Forward headers
        response.headers.forEach((value, key) => {
            // Handle set-cookie separately to preserve multiple cookies
            if (key.toLowerCase() === 'set-cookie')
                return;
            // Avoid setting content-encoding if we are decoding it (fetch decodes automatically usually)
            if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
                res.setHeader(key, value);
            }
        });
        // Handle Set-Cookie
        // @ts-ignore - getSetCookie is available in recent Node versions
        if (typeof response.headers.getSetCookie === 'function') {
            // @ts-ignore
            const cookies = response.headers.getSetCookie();
            if (cookies && cookies.length > 0) {
                res.setHeader('set-cookie', cookies);
            }
        }
        else {
            // Fallback
            const cookie = response.headers.get('set-cookie');
            if (cookie) {
                res.setHeader('set-cookie', cookie);
            }
        }
        if (response.body) {
            // @ts-ignore - Readable.fromWeb expects a web ReadableStream
            stream_1.Readable.fromWeb(response.body).pipe(res);
        }
        else {
            res.end();
        }
    }
    catch (err) {
        console.error('Proxy error:', err);
        // If headers are already sent, we can't send status
        if (!res.headersSent) {
            res.status(500).send(err.message);
        }
    }
});
app.use('/api', repoRoutes_1.default);
app.listen(PORT, () => {
    const ip = (0, network_1.getLocalIpAddress)();
    console.log(`Server running on port ${PORT}`);
    console.log(`To connect from Android, use API Base URL: http://${ip}:${PORT}`);
});
