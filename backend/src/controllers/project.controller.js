import crypto from 'crypto';
import path from 'path';
import { safeExtractZip, removeFileOrFolder } from '../utils/file.utils.js';
import { RepositoryService } from '../services/repository.service.js';
import { ProjectStore } from '../services/project.store.js';
import { SearchService } from '../services/search.service.js';
import { FileService } from '../services/file.service.js';
import { AIService } from '../services/ai/ai.service.js';
import { AskService } from '../services/ask.service.js';
import { MetricsAnalyzer } from '../analyzers/metrics.analyzer.js';
import { GitHubService } from '../services/github.service.js';
import { PasteService } from '../services/paste.service.js';

export async function uploadProject(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No ZIP file was uploaded' });
    }

    const uploadedFilePath = req.file.path;
    const originalName = req.file.originalname;

    const ext = path.extname(originalName).toLowerCase();
    if (ext !== '.zip') {
      removeFileOrFolder(uploadedFilePath);
      return res.status(400).json({ success: false, error: 'Only ZIP files are supported' });
    }

    const projectId = crypto.randomUUID();
    const tempDir = path.join(process.cwd(), 'temp', projectId);

    try {
      safeExtractZip(uploadedFilePath, tempDir);
    } catch (extractErr) {
      removeFileOrFolder(uploadedFilePath);
      removeFileOrFolder(tempDir);
      return res.status(400).json({ success: false, error: `Failed to extract repository: ${extractErr.message}` });
    }

    removeFileOrFolder(uploadedFilePath);

    try {
      const projectData = RepositoryService.runFullAnalysis(projectId, tempDir, originalName);
      return res.status(200).json({ success: true, project: projectData });
    } catch (scanErr) {
      removeFileOrFolder(tempDir);
      return res.status(500).json({ success: false, error: `Failed to scan and analyze repository: ${scanErr.message}` });
    }
  } catch (err) {
    next(err);
  }
}

export async function uploadGitHub(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      console.warn('[uploadGitHub] Missing GitHub repository URL in request body');
      return res.status(400).json({ success: false, error: 'GitHub repository URL is required' });
    }

    console.log(`[uploadGitHub] Starting GitHub repository ingestion: ${url}`);
    const projectData = await GitHubService.ingestRepository(url);
    console.log(`[uploadGitHub] Successfully ingested GitHub repository: ${url} (id: ${projectData.id}, files: ${projectData.fileCount})`);
    return res.status(200).json({ success: true, project: projectData });
  } catch (err) {
    console.error(`[uploadGitHub] Ingestion failed for '${req.body?.url}':`, err.message || err);
    return res.status(400).json({ success: false, error: err.message || 'GitHub ingestion failed' });
  }
}

export function uploadPaste(req, res) {
  try {
    const { structure, name } = req.body;
    if (!structure) {
      console.warn('[uploadPaste] Missing project structure in request body');
      return res.status(400).json({ success: false, error: 'Project structure text is required' });
    }

    console.log(`[uploadPaste] Ingesting pasted structure for: ${name || 'Pasted-Project'}`);
    const projectData = PasteService.ingestPastedStructure(structure, name || 'Pasted-Project');
    console.log(`[uploadPaste] Successfully ingested pasted structure (id: ${projectData.id}, files: ${projectData.fileCount})`);
    return res.status(200).json({ success: true, project: projectData });
  } catch (err) {
    console.error('[uploadPaste] Ingestion failed:', err.message || err);
    return res.status(400).json({ success: false, error: err.message || 'Paste ingestion failed' });
  }
}

export function listProjects(_req, res) {
  const projects = ProjectStore.listProjects();
  res.status(200).json({ success: true, projects });
}

export function getProjectDetails(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  res.status(200).json({ success: true, project });
}

export function getCurrentProject(_req, res) {
  const projects = ProjectStore.listProjects();
  if (projects.length === 0) {
    return res.status(404).json({ success: false, error: 'No projects available' });
  }

  const sorted = projects.sort((a, b) => new Date(b.lastAnalyzedAt) - new Date(a.lastAnalyzedAt));
  res.status(200).json({ success: true, project: sorted[0] });
}

export function getArchitecture(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  res.status(200).json({
    success: true,
    modules: project.architecture?.modules || [],
    edges: project.architecture?.edges || [],
    layout: project.architecture?.layout || {},
  });
}

export function getDependencies(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  res.status(200).json({
    success: true,
    nodes: project.dependencies?.nodes || [],
    edges: project.dependencies?.edges || [],
    internalDependencies: project.dependencies?.internalDependencies || [],
    externalDependencies: project.dependencies?.externalDependencies || [],
  });
}

export function getApiEndpoints(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  res.status(200).json({ success: true, apis: project.apis || [] });
}

export function getDatabaseSchema(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  res.status(200).json({
    success: true,
    tables: project.database?.tables || [],
    relations: project.database?.relations || [],
  });
}

export function getFileTree(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  res.status(200).json({ success: true, tree: project.fileTree || [] });
}

export function getMetrics(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const calculated = MetricsAnalyzer.calculateMetrics(project);
  res.status(200).json({
    success: true,
    metrics: calculated.metrics,
    health: calculated.health,
    timeline: [
      { time: 'Analysis complete', label: `Indexed ${project.fileCount} files`, tone: 'ok' },
      { time: 'APIs mapped', label: `Detected ${project.apis?.length || 0} Express endpoints`, tone: 'info' },
      { time: 'Dependencies built', label: `${project.dependencies?.edges?.length || 0} dependency edges`, tone: 'ok' },
    ],
  });
}

export function searchCode(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const { q } = req.query;

  if (!targetId) return res.status(404).json({ success: false, error: 'Project not found' });

  const results = SearchService.search(targetId, q || '');
  res.status(200).json({ success: true, results });
}

export function getFileSource(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const filePath = req.query.path || req.params[0];

  if (!targetId) return res.status(404).json({ success: false, error: 'Project not found' });
  if (!filePath) return res.status(400).json({ success: false, error: 'File path parameter is required' });

  try {
    const data = FileService.getFileSource(targetId, filePath);
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getInsights(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const project = targetId ? ProjectStore.getProject(targetId) : null;

  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    const insights = await AIService.generateInsights(project);
    res.status(200).json({ success: true, insights });
  } catch (err) {
    console.error(`[getInsights] Error for project ${targetId}:`, err.message || err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function askCodePilot(req, res) {
  const { projectId } = req.params;
  const targetId = projectId === 'current' ? getCurrentProjectId() : projectId;
  const { question } = req.body;

  if (!targetId) {
    console.warn('[askCodePilot] Project not found');
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  if (!question) {
    console.warn('[askCodePilot] Missing question text');
    return res.status(400).json({ success: false, error: 'Question text is required' });
  }

  try {
    console.log(`[askCodePilot] Querying AI for project ${targetId}: "${question}"`);
    const answer = await AskService.ask(targetId, question);
    res.status(200).json({ success: true, answer });
  } catch (err) {
    console.error(`[askCodePilot] Error for project ${targetId}:`, err.message || err);
    res.status(500).json({ success: false, error: err.message });
  }
}

function getCurrentProjectId() {
  const projects = ProjectStore.listProjects();
  if (projects.length === 0) return null;
  const sorted = projects.sort((a, b) => new Date(b.lastAnalyzedAt) - new Date(a.lastAnalyzedAt));
  return sorted[0].id;
}
