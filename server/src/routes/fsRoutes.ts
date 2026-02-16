import express from 'express';
import fsController from '../controllers/fsController';

const router = express.Router();

router.get('/list', (req, res) => fsController.list(req, res));

export default router;
