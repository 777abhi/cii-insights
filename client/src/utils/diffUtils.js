import { diffLines } from 'diff';

export const DiffUtils = {
    /**
     * Computes the number of lines added and deleted between two strings.
     * @param {string} oldText - The original text.
     * @param {string} newText - The new text.
     * @returns {Object} { additions: number, deletions: number }
     */
    computeStats(oldText, newText) {
        const changes = diffLines(oldText || '', newText || '');
        let additions = 0;
        let deletions = 0;

        changes.forEach(part => {
            if (part.added) {
                additions += part.count;
            } else if (part.removed) {
                deletions += part.count;
            }
        });

        return { additions, deletions };
    }
};
