import fs from 'fs';
import path from 'path';

/**
 * File-system backed project metadata and analysis storage manager.
 */
export class ProjectStore {
  static getProjectDir(projectId) {
    return path.join(process.cwd(), 'temp', projectId);
  }

  static getMetaFilePath(projectId) {
    return path.join(ProjectStore.getProjectDir(projectId), 'analysis.json');
  }

  /**
   * Saves project metadata and complete analysis results to disk
   */
  static saveProject(projectId, data) {
    const projectDir = ProjectStore.getProjectDir(projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      ProjectStore.getMetaFilePath(projectId),
      JSON.stringify(payload, null, 2),
      'utf8'
    );

    return payload;
  }

  /**
   * Reads saved project analysis data
   */
  static getProject(projectId) {
    const filePath = ProjectStore.getMetaFilePath(projectId);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Lists all indexed projects
   */
  static listProjects() {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) return [];

    const dirs = fs.readdirSync(tempDir);
    const projects = [];

    for (const d of dirs) {
      const proj = ProjectStore.getProject(d);
      if (proj) {
        projects.push(proj);
      }
    }

    return projects;
  }
}
