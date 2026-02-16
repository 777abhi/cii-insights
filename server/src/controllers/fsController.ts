import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

class FSController {
  list(req: Request, res: Response) {
    const currentPath = req.query.path as string || os.homedir();

    try {
      if (!fs.existsSync(currentPath)) {
        return res.status(404).json({ error: 'Path not found' });
      }

      const stats = fs.statSync(currentPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'Path is not a directory' });
      }

      const entries = fs.readdirSync(currentPath, { withFileTypes: true })
        .map(entry => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: path.join(currentPath, entry.name)
        }))
        .sort((a, b) => {
          if (a.isDirectory === b.isDirectory) {
            return a.name.localeCompare(b.name);
          }
          return a.isDirectory ? -1 : 1;
        });

      const parent = path.dirname(currentPath);

      res.json({
        path: currentPath,
        parent: parent !== currentPath ? parent : null,
        entries
      });
    } catch (error: any) {
      console.error('Error listing directory:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new FSController();
