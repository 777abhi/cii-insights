"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const repoController_1 = __importDefault(require("../controllers/repoController"));
router.post('/analyze', (req, res) => repoController_1.default.analyzeRepo(req, res));
router.get('/repos', (req, res) => repoController_1.default.listRepos(req, res));
router.delete('/repos', (req, res) => repoController_1.default.deleteRepos(req, res));
exports.default = router;
