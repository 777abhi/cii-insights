"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fsController_1 = __importDefault(require("../controllers/fsController"));
const router = express_1.default.Router();
router.get('/list', (req, res) => fsController_1.default.list(req, res));
exports.default = router;
