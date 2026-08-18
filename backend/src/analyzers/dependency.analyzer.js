import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

export class DependencyAnalyzer {
  /**
   * Analyzes dependencies across all code files in the extracted repository directory.
   * @param {string} rootDir - Path to extracted project directory
   * @param {string[]} relativeFiles - List of relative file paths from scanning
   * @returns {Object} Dependency graph and structured internal/external dependencies
   */
  static analyze(rootDir, relativeFiles) {
    const fileSet = new Set(relativeFiles);

    // Map of normalized relative path -> file info
    const internalDependencies = [];
    const externalDependencies = [];
    const edges = [];
    const nodesMap = new Map();

    // Register all files as initial nodes
    for (const relPath of relativeFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        const kind = DependencyAnalyzer.determineFileKind(relPath);
        nodesMap.set(relPath, {
          id: relPath,
          file: path.basename(relPath),
          path: relPath,
          kind,
          imports: [],
          importedBy: [],
          circular: 0,
          complexity: 'Low',
        });
      }
    }

    // Process JS/TS files
    for (const relPath of relativeFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        continue;
      }

      const fullPath = path.join(rootDir, relPath);
      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const importsFound = DependencyAnalyzer.extractImportsFromCode(content, relPath);

      for (const imp of importsFound) {
        if (imp.isRelative) {
          const resolvedTarget = DependencyAnalyzer.resolveRelativePath(
            relPath,
            imp.rawPath,
            fileSet
          );

          if (resolvedTarget) {
            internalDependencies.push({
              source: relPath,
              target: resolvedTarget,
              type: imp.type,
              symbol: imp.symbol,
            });

            edges.push({
              id: `${relPath}->${resolvedTarget}`,
              source: relPath,
              target: resolvedTarget,
              label: imp.symbol || imp.type,
              type: imp.type,
            });

            const sourceNode = nodesMap.get(relPath);
            if (sourceNode && !sourceNode.imports.includes(resolvedTarget)) {
              sourceNode.imports.push(resolvedTarget);
            }

            const targetNode = nodesMap.get(resolvedTarget);
            if (targetNode && !targetNode.importedBy.includes(relPath)) {
              targetNode.importedBy.push(relPath);
            }
          }
        } else {
          externalDependencies.push({
            file: relPath,
            package: imp.rawPath,
            symbol: imp.symbol,
          });
        }
      }
    }

    const nodes = Array.from(nodesMap.values());

    return {
      nodes,
      edges,
      internalDependencies,
      externalDependencies,
    };
  }

  /**
   * AST Parser for JavaScript/TypeScript file content to extract imports and require statements
   */
  static extractImportsFromCode(code, filename) {
    const results = [];
    let ast;

    try {
      ast = parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'dynamicImport',
          'exportDefaultFrom',
        ],
      });
    } catch {
      // Return empty array if file fails parsing (graceful fallback)
      return results;
    }

    try {
      traverse(ast, {
        ImportDeclaration(pathNode) {
          const rawPath = pathNode.node.source.value;
          const isRelative = rawPath.startsWith('.');
          const specifiers = pathNode.node.specifiers || [];

          let symbol = '';
          if (specifiers.length > 0) {
            symbol = specifiers
              .map((s) => {
                if (s.type === 'ImportDefaultSpecifier') return s.local.name;
                if (s.type === 'ImportSpecifier') return s.imported ? s.imported.name : s.local.name;
                if (s.type === 'ImportNamespaceSpecifier') return s.local.name;
                return '';
              })
              .filter(Boolean)
              .join(', ');
          }

          results.push({
            rawPath,
            isRelative,
            type: 'import',
            symbol: symbol || undefined,
          });
        },

        CallExpression(pathNode) {
          const callee = pathNode.node.callee;
          if (
            callee.type === 'Identifier' &&
            callee.name === 'require' &&
            pathNode.node.arguments.length > 0
          ) {
            const arg = pathNode.node.arguments[0];
            if (arg.type === 'StringLiteral') {
              const rawPath = arg.value;
              const isRelative = rawPath.startsWith('.');
              results.push({
                rawPath,
                isRelative,
                type: 'require',
              });
            }
          }
        },

        ExportNamedDeclaration(pathNode) {
          if (pathNode.node.source && pathNode.node.source.value) {
            const rawPath = pathNode.node.source.value;
            const isRelative = rawPath.startsWith('.');
            results.push({
              rawPath,
              isRelative,
              type: 're-export',
            });
          }
        },

        ExportAllDeclaration(pathNode) {
          if (pathNode.node.source && pathNode.node.source.value) {
            const rawPath = pathNode.node.source.value;
            const isRelative = rawPath.startsWith('.');
            results.push({
              rawPath,
              isRelative,
              type: 're-export',
            });
          }
        },
      });
    } catch {
      // Traverse error handling
    }

    return results;
  }

  /**
   * Resolves relative import path against known files in the repository
   */
  static resolveRelativePath(currentRelFile, importPath, fileSet) {
    const currentDir = path.dirname(currentRelFile);
    let resolved = path.normalize(path.join(currentDir, importPath)).replace(/\\/g, '/');

    // Check exact match
    if (fileSet.has(resolved)) {
      return resolved;
    }

    // Check with extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    for (const ext of extensions) {
      if (fileSet.has(resolved + ext)) {
        return resolved + ext;
      }
    }

    // Check index file inside folder
    for (const ext of extensions) {
      const indexCandidate = `${resolved}/index${ext}`;
      if (fileSet.has(indexCandidate)) {
        return indexCandidate;
      }
    }

    return null;
  }

  /**
   * Determine file kind heuristic for dependency node visualization
   */
  static determineFileKind(filePath) {
    const lower = filePath.toLowerCase();
    if (lower.includes('service')) return 'service';
    if (lower.includes('controller')) return 'controller';
    if (lower.includes('model') || lower.includes('schema')) return 'model';
    if (lower.includes('route') || lower.includes('api')) return 'route';
    if (lower.includes('middleware')) return 'middleware';
    if (lower.includes('component')) return 'component';
    return 'util';
  }
}
