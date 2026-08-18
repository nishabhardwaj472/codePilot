import fs from 'fs';
import path from 'path';
import { ProjectStore } from './project.store.js';

export class FileService {
  /**
   * Safely reads source code content and intelligence metadata for a file.
   * @param {string} projectId Project UUID
   * @param {string} relativeFilePath Relative path within repo
   */
  static getFileSource(projectId, relativeFilePath) {
    const project = ProjectStore.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectDir = ProjectStore.getProjectDir(projectId);

    // Security: Path Traversal Protection
    const normalizedRelative = path.normalize(relativeFilePath).replace(/^(\.\.[\/\\])+/, '');
    const absoluteFilePath = path.join(projectDir, normalizedRelative);
    const normalizedDest = path.normalize(projectDir) + path.sep;
    const normalizedTarget = path.normalize(absoluteFilePath);

    if (!normalizedTarget.startsWith(normalizedDest)) {
      throw new Error('Access denied: Invalid file path');
    }

    if (!fs.existsSync(normalizedTarget) || !fs.statSync(normalizedTarget).isFile()) {
      throw new Error('File not found');
    }

    const code = fs.readFileSync(normalizedTarget, 'utf8');

    // Attach symbols & dependencies intelligence for this specific file
    const symbols = project.symbols?.[normalizedRelative] || [];
    const imports = (project.dependencies?.internalDependencies || []).filter(
      (dep) => dep.source === normalizedRelative
    );
    const importedBy = (project.dependencies?.internalDependencies || []).filter(
      (dep) => dep.target === normalizedRelative
    );

    return {
      path: normalizedRelative,
      code,
      intelligence: {
        symbols,
        imports,
        importedBy,
        lineCount: code.split('\n').length,
      },
    };
  }
}
