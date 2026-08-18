import path from 'path';

export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '.vite',
  'vendor',
  'tmp',
  'temp',
]);

export const IGNORED_FILES = new Set([
  '.ds_store',
  'thumbs.db',
  'desktop.ini',
]);

export const EXTENSION_TO_LANGUAGE = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.json': 'JSON',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'SCSS',
  '.less': 'CSS',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.vue': 'Vue',
  '.py': 'Python',
  '.java': 'Java',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.c': 'C',
  '.h': 'C/C++',
  '.hpp': 'C++',
  '.go': 'Go',
  '.rs': 'Rust',
  '.md': 'Markdown',
  '.markdown': 'Markdown',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.sql': 'SQL',
};

/**
 * Detect language from file path extension
 * @param {string} filePath
 * @returns {string}
 */
export function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return 'Other';
  return EXTENSION_TO_LANGUAGE[ext] || 'Other';
}

/**
 * Check if a directory name should be ignored during scanning
 * @param {string} dirName
 * @returns {boolean}
 */
export function isIgnoredDir(dirName) {
  return IGNORED_DIRECTORIES.has(dirName.toLowerCase());
}

/**
 * Check if a file name should be ignored during scanning
 * @param {string} fileName
 * @returns {boolean}
 */
export function isIgnoredFile(fileName) {
  return IGNORED_FILES.has(fileName.toLowerCase());
}
