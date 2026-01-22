"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gitLogParser_1 = __importDefault(require("./gitLogParser"));
const velocityAnalyzer_1 = __importDefault(require("./analyzers/velocityAnalyzer"));
const qualityAnalyzer_1 = __importDefault(require("./analyzers/qualityAnalyzer"));
const churnAnalyzer_1 = __importDefault(require("./analyzers/churnAnalyzer"));
const hotspotAnalyzer_1 = __importDefault(require("./analyzers/hotspotAnalyzer"));
const contributorAnalyzer_1 = __importDefault(require("./analyzers/contributorAnalyzer"));
const commitTypeAnalyzer_1 = __importDefault(require("./analyzers/commitTypeAnalyzer"));
class AnalysisService {
    constructor() {
        this.analyzers = [
            velocityAnalyzer_1.default,
            qualityAnalyzer_1.default,
            churnAnalyzer_1.default,
            hotspotAnalyzer_1.default,
            contributorAnalyzer_1.default,
            commitTypeAnalyzer_1.default
        ];
    }
    analyze(logOutput) {
        const commits = gitLogParser_1.default.parse(logOutput);
        const results = {
            totalCommits: commits.length,
            recentCommits: commits.slice(0, 10),
        };
        for (const analyzer of this.analyzers) {
            Object.assign(results, analyzer.analyze(commits));
        }
        return results;
    }
}
exports.default = new AnalysisService();
