const express = require('express');
const cors = require('cors');
const { getLocalIpAddress } = require('./utils/network');
const repoRoutes = require('./routes/repoRoutes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', repoRoutes);

app.listen(PORT, () => {
  const ip = getLocalIpAddress();
  console.log(`Server running on port ${PORT}`);
  console.log(`To connect from Android, use API Base URL: http://${ip}:${PORT}`);
});
