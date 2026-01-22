import express from 'express';
import cors from 'cors';
import { getLocalIpAddress } from './utils/network';
import repoRoutes from './routes/repoRoutes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Git CORS Proxy
const proxy = require('cors-anywhere').createServer({
  originWhitelist: [], // Allow all origins
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2']
});

app.use('/git-proxy', (req, res) => {
  // req.url has /git-proxy stripped by app.use
  // Fix normalization of // -> / by proxies
  if (req.url.startsWith('/https:/') && !req.url.startsWith('/https://')) {
    req.url = req.url.replace('/https:/', '/https://');
  }
  if (req.url.startsWith('/http:/') && !req.url.startsWith('/http://')) {
    req.url = req.url.replace('/http:/', '/http://');
  }
  proxy.emit('request', req, res);
});

app.use('/api', repoRoutes);

app.listen(PORT, () => {
  const ip = getLocalIpAddress();
  console.log(`Server running on port ${PORT}`);
  console.log(`To connect from Android, use API Base URL: http://${ip}:${PORT}`);
});
