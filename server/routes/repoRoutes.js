const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');

router.post('/analyze', repoController.analyzeRepo);
router.get('/repos', repoController.listRepos);
router.delete('/repos', repoController.deleteRepos);

module.exports = router;
