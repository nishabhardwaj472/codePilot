import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

export class SymbolAnalyzer {
  /**
   * Scans a single file or repository to extract code symbols.
   * @param {string} rootDir Path to extracted project directory
   * @param {string[]} relativeFiles List of relative file paths
   * @returns {Record<string, Array<Object>>} Object mapping relativeFilePath -> array of symbols
   */
  static analyzeRepository(rootDir, relativeFiles) {
    const fileSymbolsMap = {};

    for (const relPath of relativeFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        continue;
      }

      const fullPath = path.join(rootDir, relPath);
      let code = '';
      try {
        code = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const symbols = SymbolAnalyzer.extractSymbols(code);
      if (symbols.length > 0) {
        fileSymbolsMap[relPath] = symbols;
      }
    }

    return fileSymbolsMap;
  }

  /**
   * Extracts functions, classes, methods, interfaces, types, variables from source code
   */
  static extractSymbols(code) {
    const symbols = [];
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
        ],
      });
    } catch {
      return symbols;
    }

    try {
      traverse(ast, {
        FunctionDeclaration(pathNode) {
          if (pathNode.node.id && pathNode.node.id.name) {
            const isExported =
              pathNode.parent.type === 'ExportNamedDeclaration' ||
              pathNode.parent.type === 'ExportDefaultDeclaration';

            symbols.push({
              name: pathNode.node.id.name,
              type: 'function',
              exported: isExported,
              line: pathNode.node.loc?.start.line || 1,
              async: pathNode.node.async || false,
            });
          }
        },

        ClassDeclaration(pathNode) {
          if (pathNode.node.id && pathNode.node.id.name) {
            const isExported =
              pathNode.parent.type === 'ExportNamedDeclaration' ||
              pathNode.parent.type === 'ExportDefaultDeclaration';

            symbols.push({
              name: pathNode.node.id.name,
              type: 'class',
              exported: isExported,
              line: pathNode.node.loc?.start.line || 1,
            });
          }
        },

        ClassMethod(pathNode) {
          if (pathNode.node.key) {
            const methodName =
              pathNode.node.key.name || pathNode.node.key.value || 'anonymous';
            const parentClass = pathNode.findParent((p) => p.isClassDeclaration());
            const className = parentClass?.node?.id?.name || '';

            symbols.push({
              name: className ? `${className}.${methodName}` : methodName,
              type: 'method',
              exported: false,
              line: pathNode.node.loc?.start.line || 1,
              kind: pathNode.node.kind, // 'constructor', 'method', 'get', 'set'
            });
          }
        },

        TSInterfaceDeclaration(pathNode) {
          if (pathNode.node.id && pathNode.node.id.name) {
            const isExported = pathNode.parent.type === 'ExportNamedDeclaration';
            symbols.push({
              name: pathNode.node.id.name,
              type: 'interface',
              exported: isExported,
              line: pathNode.node.loc?.start.line || 1,
            });
          }
        },

        TSTypeAliasDeclaration(pathNode) {
          if (pathNode.node.id && pathNode.node.id.name) {
            const isExported = pathNode.parent.type === 'ExportNamedDeclaration';
            symbols.push({
              name: pathNode.node.id.name,
              type: 'type',
              exported: isExported,
              line: pathNode.node.loc?.start.line || 1,
            });
          }
        },

        VariableDeclarator(pathNode) {
          if (pathNode.node.id && pathNode.node.id.name) {
            const name = pathNode.node.id.name;
            const init = pathNode.node.init;

            if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
              const variableDecl = pathNode.parentPath?.parent;
              const isExported =
                variableDecl?.type === 'ExportNamedDeclaration' ||
                variableDecl?.type === 'ExportDefaultDeclaration';

              symbols.push({
                name,
                type: 'function',
                exported: isExported,
                line: pathNode.node.loc?.start.line || 1,
                async: init.async || false,
              });
            } else {
              // Top-level constant/variable check
              const isTopLevel = pathNode.parentPath?.parentPath?.isProgram();
              if (isTopLevel) {
                const isExported = pathNode.parentPath?.parent?.type === 'ExportNamedDeclaration';
                symbols.push({
                  name,
                  type: 'constant',
                  exported: isExported,
                  line: pathNode.node.loc?.start.line || 1,
                });
              }
            }
          }
        },
      });
    } catch {
      // Traverse error handling
    }

    return symbols;
  }
}
