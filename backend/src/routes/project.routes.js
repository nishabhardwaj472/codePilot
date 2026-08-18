import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadProject,
  uploadGitHub,
  uploadPaste,
  listProjects,
  getProjectDetails,
  getCurrentProject,
  getArchitecture,
  getDependencies,
  getApiEndpoints,
  getDatabaseSchema,
  getFileTree,
  getMetrics,
  searchCode,
  getFileSource,
  getInsights,
  askCodePilot,
} from '../controllers/project.controller.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const MAX_FILE_SIZE = 120 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      const err = new Error('Only ZIP files are supported');
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
});

function handleUploadMiddleware(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: 'File size exceeds the 120 MB limit' });
        }
        return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
      }
      return res.status(err.statusCode || 400).json({ success: false, error: err.message || 'Invalid upload request' });
    }
    next();
  });
}

// Upload & Ingestion Routes
router.post('/upload', handleUploadMiddleware, uploadProject);
router.post('/github', uploadGitHub);
router.post('/paste', uploadPaste);

// Project List & Current
router.get('/', listProjects);
router.get('/current', getCurrentProject);

// Analysis endpoints supporting /api/projects/current/* and /api/projects/:projectId/*
router.get('/:projectId/architecture', getArchitecture);
router.get('/:projectId/dependencies', getDependencies);
router.get('/:projectId/apis', getApiEndpoints);
router.get('/:projectId/database', getDatabaseSchema);
router.get('/:projectId/tree', getFileTree);
router.get('/:projectId/metrics', getMetrics);
router.get('/:projectId/search', searchCode);
router.get('/:projectId/source', getFileSource);
router.get('/:projectId/insights', getInsights);
router.post('/:projectId/ask', askCodePilot);

router.get('/:projectId', getProjectDetails);

export default router;
