import { diffLines, Change } from 'diff';

export const DiffUtils = {
    /**
     * Computes the number of lines added and deleted between two strings.
     */
    computeStats(oldText: string, newText: string): { additions: number; deletions: number } {
        const changes: Change[] = diffLines(oldText || '', newText || '');
        let additions = 0;
        let deletions = 0;

        changes.forEach(part => {
            if (part.added) {
                additions += part.count || 0;
            } else if (part.removed) {
                deletions += part.count || 0;
            }
        });

        return { additions, deletions };
    }
};
