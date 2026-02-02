## 2024-05-22 - Regex Recompilation Bottleneck
**Learning:** `GitLogParser` was re-compiling regexes for every line of the git log, causing significant CPU overhead on large repositories.
**Action:** Always hoist static regexes to module scope or class constants.

## 2024-05-22 - Tracked Build Artifacts
**Learning:** The `server/dist` directory is tracked in git.
**Action:** When modifying server source, ensure `npm run build` is run and the updated `dist` files are included in the commit.
