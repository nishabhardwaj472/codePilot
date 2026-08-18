import path from 'path';
import { ProjectStore } from './project.store.js';

export class SearchService {
  /**
   * Performs ranked repository search across files, symbols, APIs, and DB models.
   * @param {string} projectId
   * @param {string} query
   * @returns {Array<Object>} List of ranked search results
   */
  static search(projectId, query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }

    const q = query.toLowerCase().trim();
    const project = ProjectStore.getProject(projectId);
    if (!project) return [];

    const results = [];

    // 1. Search Files
    for (const filePath of project.files || []) {
      const filename = path.basename(filePath);
      if (filename.toLowerCase().includes(q) || filePath.toLowerCase().includes(q)) {
        results.push({
          type: 'file',
          group: 'Files',
          name: filename,
          label: filename,
          file: filePath,
          detail: filePath,
          to: `/files?path=${encodeURIComponent(filePath)}`,
          score: filename.toLowerCase().startsWith(q) ? 10 : 5,
        });
      }
    }

    // 2. Search Symbols (Functions, Classes, Methods, Types)
    const symbolsMap = project.symbols || {};
    for (const [relFile, symList] of Object.entries(symbolsMap)) {
      for (const sym of symList) {
        if (sym.name && sym.name.toLowerCase().includes(q)) {
          results.push({
            type: sym.type,
            group: sym.type === 'class' ? 'Classes' : 'Functions',
            name: sym.name,
            label: sym.name,
            file: relFile,
            line: sym.line,
            detail: `${sym.type} in ${relFile}:${sym.line}`,
            to: `/files?path=${encodeURIComponent(relFile)}&line=${sym.line}`,
            score: sym.name.toLowerCase() === q ? 20 : sym.name.toLowerCase().startsWith(q) ? 15 : 8,
          });
        }
      }
    }

    // 3. Search API Endpoints
    for (const api of project.apis || []) {
      if (
        api.path.toLowerCase().includes(q) ||
        api.handler.toLowerCase().includes(q) ||
        api.method.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'api',
          group: 'APIs',
          name: `${api.method} ${api.path}`,
          label: `${api.method} ${api.path}`,
          file: api.file,
          line: api.line,
          detail: `Handler ${api.handler} in ${api.file}`,
          to: '/apis',
          score: api.path.toLowerCase().includes(q) ? 12 : 6,
        });
      }
    }

    // 4. Search Database Models
    for (const table of project.database?.tables || []) {
      if (table.name.toLowerCase().includes(q) || table.collection.toLowerCase().includes(q)) {
        results.push({
          type: 'model',
          group: 'Database',
          name: table.name,
          label: table.name,
          file: table.file || '',
          detail: `Mongoose Model (${table.columns?.length || 0} fields)`,
          to: '/database',
          score: table.name.toLowerCase() === q ? 18 : 10,
        });
      }
    }

    // Sort by relevance score descending
    return results.sort((a, b) => b.score - a.score);
  }
}
