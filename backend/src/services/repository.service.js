import fs from 'fs';
import path from 'path';
import { detectLanguage, isIgnoredDir, isIgnoredFile } from '../utils/project.utils.js';
import { DependencyAnalyzer } from '../analyzers/dependency.analyzer.js';
import { SymbolAnalyzer } from '../analyzers/symbol.analyzer.js';
import { ApiAnalyzer } from '../analyzers/api.analyzer.js';
import { DatabaseAnalyzer } from '../analyzers/database.analyzer.js';
import { ArchitectureAnalyzer } from '../analyzers/architecture.analyzer.js';
import { ProjectStore } from './project.store.js';

export class RepositoryService {
  /**
   * Executes the complete analysis pipeline (Scanning -> Dependencies -> Symbols -> APIs -> Database -> Architecture)
   * @param {string} projectId Unique UUID for the project
   * @param {string} rootDir Path to extracted zip root
   * @param {string} zipOriginalName Original upload filename
   */
  static runFullAnalysis(projectId, rootDir, zipOriginalName = 'project.zip') {
    // 1. Basic Scan & File Tree
    const scanResult = RepositoryService.scanRepository(rootDir, zipOriginalName);
    const targetDir = scanResult.scanTargetDir;

    // 2. Dependency Analysis
    const depResult = DependencyAnalyzer.analyze(targetDir, scanResult.files);

    // 3. Symbol Analysis
    const symbolsMap = SymbolAnalyzer.analyzeRepository(targetDir, scanResult.files);

    // 4. API Endpoint Analysis
    const apiList = ApiAnalyzer.analyze(targetDir, scanResult.files);

    // 5. Database & Schema Analysis
    const dbResult = DatabaseAnalyzer.analyze(targetDir, scanResult.files);

    // 6. Architecture Analysis
    const archResult = ArchitectureAnalyzer.analyze(scanResult, depResult, apiList, dbResult);

    const projectData = {
      id: projectId,
      name: scanResult.name,
      rootDir: targetDir,
      repoUrl: `local://${scanResult.name}`,
      branch: 'main',
      status: 'COMPLETED',
      fileCount: scanResult.fileCount,
      directoryCount: scanResult.directoryCount,
      primaryLanguage: scanResult.primaryLanguage,
      lastAnalyzedAt: new Date().toISOString(),
      stack: RepositoryService.inferStack(scanResult, depResult, dbResult, apiList),
      languages: scanResult.languages,
      files: scanResult.files,
      fileTree: scanResult.fileTree,
      package: scanResult.package,
      dependencies: {
        nodes: depResult.nodes,
        edges: depResult.edges,
        internalDependencies: depResult.internalDependencies,
        externalDependencies: depResult.externalDependencies,
      },
      symbols: symbolsMap,
      apis: apiList,
      database: dbResult,
      architecture: archResult,
    };

    // Save to Project Store
    ProjectStore.saveProject(projectId, projectData);

    return projectData;
  }

  /**
   * Scans an extracted repository folder and returns file list & statistics.
   */
  static scanRepository(rootDir, zipOriginalName = 'project.zip') {
    let scanTargetDir = rootDir;

    const topLevelItems = fs.readdirSync(rootDir).filter(item => {
      return !isIgnoredDir(item) && !isIgnoredFile(item);
    });

    if (topLevelItems.length === 1) {
      const candidatePath = path.join(rootDir, topLevelItems[0]);
      if (fs.statSync(candidatePath).isDirectory()) {
        scanTargetDir = candidatePath;
      }
    }

    const relativeFiles = [];
    const languageStats = {};
    let fileCount = 0;
    let directoryCount = 0;

    function walkDir(currentPath, relativePath = '') {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        if (isIgnoredDir(item) || isIgnoredFile(item)) {
          continue;
        }

        const fullPath = path.join(currentPath, item);
        const itemRelPath = relativePath ? `${relativePath}/${item}` : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          directoryCount++;
          walkDir(fullPath, itemRelPath);
        } else if (stat.isFile()) {
          fileCount++;
          relativeFiles.push(itemRelPath);

          const lang = detectLanguage(itemRelPath);
          languageStats[lang] = (languageStats[lang] || 0) + 1;
        }
      }
    }

    walkDir(scanTargetDir);

    const fileTree = RepositoryService.buildFileTree(scanTargetDir);
    const packageMeta = RepositoryService.detectPackageMetadata(scanTargetDir);
    const projectName = RepositoryService.detectProjectName(
      scanTargetDir,
      packageMeta?.name,
      zipOriginalName
    );

    let primaryLanguage = 'Unknown';
    let maxLangCount = 0;
    for (const [lang, count] of Object.entries(languageStats)) {
      if (lang !== 'Other' && count > maxLangCount) {
        maxLangCount = count;
        primaryLanguage = lang;
      }
    }

    return {
      name: projectName,
      fileCount,
      directoryCount,
      primaryLanguage,
      languages: languageStats,
      files: relativeFiles,
      fileTree,
      package: packageMeta,
      scanTargetDir,
    };
  }

  static buildFileTree(rootDir) {
    function parseDirectory(currentPath, relPath = '') {
      const items = fs.readdirSync(currentPath);
      const children = [];

      for (const item of items) {
        if (isIgnoredDir(item) || isIgnoredFile(item)) {
          continue;
        }

        const fullPath = path.join(currentPath, item);
        const itemRelPath = relPath ? `${relPath}/${item}` : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const subChildren = parseDirectory(fullPath, itemRelPath);
          children.push({
            name: item,
            path: itemRelPath,
            type: 'dir',
            directory: true,
            children: subChildren,
          });
        } else if (stat.isFile()) {
          const lang = detectLanguage(item);
          children.push({
            name: item,
            path: itemRelPath,
            type: 'file',
            file: true,
            language: lang,
          });
        }
      }

      return children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
    }

    const rootName = path.basename(rootDir);
    return [
      {
        name: rootName,
        path: '.',
        type: 'dir',
        directory: true,
        children: parseDirectory(rootDir),
      },
    ];
  }

  static detectPackageMetadata(targetDir) {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;

    try {
      const content = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(content);

      const depCount = pkg.dependencies ? Object.keys(pkg.dependencies).length : 0;
      const devDepCount = pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0;

      let packageManager = 'npm';
      if (pkg.packageManager) {
        packageManager = pkg.packageManager.split('@')[0];
      } else if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) {
        packageManager = 'pnpm';
      } else if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) {
        packageManager = 'yarn';
      }

      return {
        name: pkg.name || null,
        version: pkg.version || '1.0.0',
        dependencies: depCount,
        devDependencies: devDepCount,
        scripts: pkg.scripts || {},
        packageManager,
      };
    } catch {
      return null;
    }
  }

  static detectProjectName(targetDir, pkgName, zipOriginalName) {
    if (pkgName && typeof pkgName === 'string' && pkgName.trim().length > 0) {
      return pkgName.trim();
    }

    const dirName = path.basename(targetDir);
    if (dirName && dirName !== 'temp' && dirName !== 'uploads') {
      return dirName;
    }

    const zipBasename = path.basename(zipOriginalName, path.extname(zipOriginalName));
    return zipBasename || 'code-project';
  }

  static inferStack(scanResult, depResult, dbResult, apiList) {
    const stack = new Set();

    if (scanResult.primaryLanguage) {
      stack.add(scanResult.primaryLanguage);
    }

    for (const extDep of depResult.externalDependencies || []) {
      const pkg = extDep.package.toLowerCase();
      if (pkg.includes('react')) stack.add('React');
      if (pkg.includes('express')) stack.add('Express');
      if (pkg.includes('mongoose') || pkg.includes('mongodb')) stack.add('MongoDB');
      if (pkg.includes('tailwind')) stack.add('Tailwind');
      if (pkg.includes('vue')) stack.add('Vue');
      if (pkg.includes('next')) stack.add('Next.js');
    }

    if (apiList.length > 0) stack.add('Express');
    if (dbResult.tables?.length > 0) stack.add('MongoDB');

    return Array.from(stack);
  }
}
