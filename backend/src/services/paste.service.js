import crypto from 'crypto';
import path from 'path';
import { detectLanguage } from '../utils/project.utils.js';
import { ArchitectureAnalyzer } from '../analyzers/architecture.analyzer.js';
import { ProjectStore } from './project.store.js';

export class PasteService {
  /**
   * Ingests a pasted project tree or file list string and builds a project model.
   * @param {string} rawStructure Pasted tree or file list text
   * @param {string} projectName Optional project name
   */
  static ingestPastedStructure(rawStructure, projectName = 'Pasted-Project') {
    if (!rawStructure || typeof rawStructure !== 'string' || rawStructure.trim().length === 0) {
      throw new Error('Project structure text cannot be empty');
    }

    const lines = rawStructure.split('\n').map((l) => l.trim()).filter(Boolean);
    const relativeFiles = [];
    const languageStats = {};

    for (const line of lines) {
      // Clean tree characters (e.g. ├──, └──, |, spaces)
      const cleanPath = line.replace(/^[│├└─\|\s]+/, '').trim();
      if (cleanPath && !cleanPath.endsWith('/')) {
        // Skip common ignored items
        if (cleanPath.includes('node_modules') || cleanPath.includes('.git')) continue;

        relativeFiles.push(cleanPath);
        const lang = detectLanguage(cleanPath);
        languageStats[lang] = (languageStats[lang] || 0) + 1;
      }
    }

    const projectId = crypto.randomUUID();
    const scanResult = {
      name: projectName,
      fileCount: relativeFiles.length,
      directoryCount: Math.ceil(relativeFiles.length / 3),
      primaryLanguage: 'JavaScript',
      languages: languageStats,
      files: relativeFiles,
      fileTree: PasteService.buildVirtualFileTree(relativeFiles, projectName),
    };

    const depResult = { nodes: [], edges: [], internalDependencies: [], externalDependencies: [] };
    const dbResult = { tables: [], relations: [] };
    const apiList = [];

    const archResult = ArchitectureAnalyzer.analyze(scanResult, depResult, apiList, dbResult);

    const projectData = {
      id: projectId,
      name: projectName,
      repoUrl: `snapshot://${projectName}`,
      branch: 'main',
      status: 'COMPLETED',
      fileCount: relativeFiles.length,
      directoryCount: scanResult.directoryCount,
      primaryLanguage: 'JavaScript',
      lastAnalyzedAt: new Date().toISOString(),
      stack: ['Snapshot', 'Pasted Structure'],
      languages: languageStats,
      files: relativeFiles,
      fileTree: scanResult.fileTree,
      dependencies: depResult,
      symbols: {},
      apis: [],
      database: dbResult,
      architecture: archResult,
    };

    ProjectStore.saveProject(projectId, projectData);
    return projectData;
  }

  static buildVirtualFileTree(fileList, rootName) {
    const children = fileList.map((filePath) => ({
      name: path.basename(filePath),
      path: filePath,
      type: 'file',
      file: true,
      language: detectLanguage(filePath),
    }));

    return [
      {
        name: rootName,
        path: '.',
        type: 'dir',
        directory: true,
        children,
      },
    ];
  }
}
