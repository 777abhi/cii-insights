import express from 'express';
const router = express.Router();
import repoController from '../controllers/repoController';

router.post('/analyze', (req, res) => repoController.analyzeRepo(req, res));
router.get('/repos', (req, res) => repoController.listRepos(req, res));
router.delete('/repos', (req, res) => repoController.deleteRepos(req, res));

export default router;
