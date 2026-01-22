"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
exports.default = {
    analyze(commits) {
        const thirtyDaysAgo = (0, date_fns_1.subDays)(new Date(), 30);
        let churnAdded = 0;
        let churnDeleted = 0;
        commits.forEach(c => {
            const commitDate = new Date(c.date);
            if (commitDate >= thirtyDaysAgo) {
                churnAdded += c.additions;
                churnDeleted += c.deletions;
            }
        });
        return { churn: { added: churnAdded, deleted: churnDeleted } };
    }
};
