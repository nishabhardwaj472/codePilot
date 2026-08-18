import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { safeExtractZip, removeFileOrFolder } from '../utils/file.utils.js';
import { RepositoryService } from './repository.service.js';

export class GitHubService {
  /**
   * Ingests a public GitHub repository URL by downloading its zip archive.
   * @param {string} githubUrl e.g. https://github.com/facebook/react
   */
  static async ingestRepository(githubUrl) {
    if (!githubUrl || !githubUrl.includes('github.com')) {
      throw new Error('Invalid GitHub repository URL');
    }

    // Parse owner and repo name from URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL format');
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    // Construct GitHub zipball download URL
    const archiveUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/main`;

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const zipFilePath = path.join(uploadsDir, `${Date.now()}-${owner}-${repo}.zip`);

    try {
      const response = await fetch(archiveUrl);
      if (!response.ok) {
        // Fallback to master branch if main branch isn't default
        const masterUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/master`;
        const masterResponse = await fetch(masterUrl);
        if (!masterResponse.ok) {
          throw new Error(`Failed to download repository from GitHub (HTTP ${response.status})`);
        }
        const buffer = Buffer.from(await masterResponse.arrayBuffer());
        fs.writeFileSync(zipFilePath, buffer);
      } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(zipFilePath, buffer);
      }

      const projectId = crypto.randomUUID();
      const tempDir = path.join(process.cwd(), 'temp', projectId);

      // Extract ZIP safely
      safeExtractZip(zipFilePath, tempDir);
      removeFileOrFolder(zipFilePath);

      // Execute standard analysis pipeline
      const projectData = RepositoryService.runFullAnalysis(projectId, tempDir, `${repo}.zip`);
      projectData.repoUrl = githubUrl;
      return projectData;
    } catch (err) {
      removeFileOrFolder(zipFilePath);
      throw err;
    }
  }
}
