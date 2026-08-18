import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'all', 'head', 'options']);

export class ApiAnalyzer {
  /**
   * Scans JavaScript/TypeScript files in the repository to extract Express routes, HTTP methods, handlers, and traced controller/service/model paths.
   * @param {string} rootDir Path to project root
   * @param {string[]} relativeFiles List of relative file paths
   * @returns {Array<Object>} List of detected API endpoints
   */
  static analyze(rootDir, relativeFiles) {
    const endpoints = [];
    const routerPrefixes = new Map(); // e.g. 'appointmentRouter' -> '/api/appointments'
    const filePrefixes = new Map();   // e.g. 'src/routes/appointment.routes.js' -> '/api/appointments'
    const fileImports = new Map();    // relPath -> Map<localName, importedRelPath>

    // Phase 1: AST import & router prefix discovery pass
    for (const relPath of relativeFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) continue;

      const fullPath = path.join(rootDir, relPath);
      let code = '';
      try {
        code = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const imports = ApiAnalyzer.extractImports(code, relPath, relativeFiles);
      fileImports.set(relPath, imports);

      ApiAnalyzer.detectRouterMounts(code, relPath, imports, routerPrefixes, filePrefixes);
    }

    // Phase 2: Extract endpoints from files
    let endpointCounter = 1;
    for (const relPath of relativeFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) continue;

      const fullPath = path.join(rootDir, relPath);
      let code = '';
      try {
        code = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const fileEndpoints = ApiAnalyzer.extractEndpointsFromFile(
        code,
        relPath,
        routerPrefixes,
        filePrefixes,
        fileImports,
        endpointCounter
      );

      endpointCounter += fileEndpoints.length;
      endpoints.push(...fileEndpoints);
    }

    return endpoints;
  }

  /**
   * Extract import/require statements from code file
   */
  static extractImports(code, currentFile, relativeFiles) {
    const imports = new Map(); // localSymbol -> targetRelativeFile
    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });
    } catch {
      return imports;
    }

    const currentDir = path.dirname(currentFile);

    const resolveRelative = (importPath) => {
      if (!importPath.startsWith('.')) return null;
      let target = path.normalize(path.join(currentDir, importPath)).replace(/\\/g, '/');
      
      const candidates = [
        target,
        `${target}.js`,
        `${target}.ts`,
        `${target}.jsx`,
        `${target}.tsx`,
        path.join(target, 'index.js').replace(/\\/g, '/'),
        path.join(target, 'index.ts').replace(/\\/g, '/'),
      ];

      for (const cand of candidates) {
        if (relativeFiles.includes(cand)) return cand;
      }
      return null;
    };

    try {
      traverse(ast, {
        ImportDeclaration(pathNode) {
          const source = pathNode.node.source.value;
          const resolved = resolveRelative(source);
          if (!resolved) return;

          for (const spec of pathNode.node.specifiers) {
            imports.set(spec.local.name, resolved);
          }
        },
        VariableDeclarator(pathNode) {
          const init = pathNode.node.init;
          if (
            init &&
            init.type === 'CallExpression' &&
            init.callee.name === 'require' &&
            init.arguments.length > 0 &&
            init.arguments[0].type === 'StringLiteral'
          ) {
            const source = init.arguments[0].value;
            const resolved = resolveRelative(source);
            if (!resolved) return;

            if (pathNode.node.id.type === 'Identifier') {
              imports.set(pathNode.node.id.name, resolved);
            } else if (pathNode.node.id.type === 'ObjectPattern') {
              for (const prop of pathNode.node.id.properties) {
                if (prop.value && prop.value.type === 'Identifier') {
                  imports.set(prop.value.name, resolved);
                }
              }
            }
          }
        },
      });
    } catch {}

    return imports;
  }

  /**
   * Detect app.use('/api/appointments', appointmentRouter) router mounts
   */
  static detectRouterMounts(code, relPath, imports, routerPrefixes, filePrefixes) {
    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });
    } catch {
      return;
    }

    try {
      traverse(ast, {
        CallExpression(pathNode) {
          const callee = pathNode.node.callee;
          if (
            callee.type === 'MemberExpression' &&
            (callee.property.name === 'use' || callee.property.name === 'all') &&
            pathNode.node.arguments.length >= 2
          ) {
            const firstArg = pathNode.node.arguments[0];
            const secondArg = pathNode.node.arguments[1];

            if (firstArg.type === 'StringLiteral') {
              const prefix = firstArg.value;

              if (secondArg.type === 'Identifier') {
                const varName = secondArg.name;
                routerPrefixes.set(varName, prefix);

                const importedFile = imports.get(varName);
                if (importedFile) {
                  filePrefixes.set(importedFile, prefix);
                }
              } else if (
                secondArg.type === 'CallExpression' &&
                secondArg.callee.name === 'require' &&
                secondArg.arguments.length > 0 &&
                secondArg.arguments[0].type === 'StringLiteral'
              ) {
                const source = secondArg.arguments[0].value;
                const importedFile = imports.get(source) || source;
                filePrefixes.set(importedFile, prefix);
              }
            }
          }
        },
      });
    } catch {}
  }

  /**
   * Extracts HTTP endpoints from AST and traces handler -> controller -> service -> model
   */
  static extractEndpointsFromFile(code, relPath, routerPrefixes, filePrefixes, fileImports, startId) {
    const results = [];
    let ast;

    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });
    } catch {
      return results;
    }

    const fileImportMap = fileImports.get(relPath) || new Map();
    const mountedPrefix = filePrefixes.get(relPath) || ApiAnalyzer.inferPrefixFromPath(relPath);

    try {
      traverse(ast, {
        CallExpression(pathNode) {
          const callee = pathNode.node.callee;

          if (callee.type === 'MemberExpression') {
            const objectName = callee.object.name || (callee.object.property ? callee.object.property.name : '');
            const methodName = callee.property.name ? callee.property.name.toLowerCase() : '';

            if (HTTP_METHODS.has(methodName) && pathNode.node.arguments.length > 0) {
              const firstArg = pathNode.node.arguments[0];

              if (firstArg.type === 'StringLiteral') {
                const subPath = firstArg.value;
                const method = methodName.toUpperCase();

                const prefix = routerPrefixes.get(objectName) || mountedPrefix || '';
                const fullEndpointPath = ApiAnalyzer.combinePaths(prefix, subPath);

                // Extract handler & middleware details
                let handlerName = 'anonymous';
                let controllerFile = relPath;
                const middlewareList = [];

                const args = pathNode.node.arguments;
                for (let i = 1; i < args.length; i++) {
                  const arg = args[i];
                  let argName = '';
                  if (arg.type === 'Identifier') {
                    argName = arg.name;
                  } else if (arg.type === 'MemberExpression') {
                    argName = `${arg.object.name || ''}.${arg.property.name || ''}`;
                  }

                  if (i === args.length - 1) {
                    handlerName = argName || 'anonymous';
                    if (arg.type === 'Identifier' && fileImportMap.has(arg.name)) {
                      controllerFile = fileImportMap.get(arg.name);
                    }
                  } else if (argName) {
                    middlewareList.push(argName);
                  }
                }

                // Trace Controller -> Service -> Model
                const tracedService = ApiAnalyzer.traceService(controllerFile, fileImports);
                const tracedModel = ApiAnalyzer.traceModel(controllerFile, tracedService, fileImports);

                // Auth requirement check
                const argsStr = code.substring(pathNode.node.start, pathNode.node.end);
                const isAuthRequired =
                  middlewareList.some((m) => /auth|protect|token|jwt/i.test(m)) ||
                  /auth|protect|verifyToken|jwt/i.test(argsStr);

                const groupName = ApiAnalyzer.determineGroup(fullEndpointPath, relPath);

                results.push({
                  id: `api-${results.length + startId}`,
                  method: method === 'ALL' ? 'GET' : method,
                  path: fullEndpointPath,
                  group: groupName,
                  summary: `${method} ${fullEndpointPath} handled by ${handlerName}`,
                  controller: path.basename(controllerFile),
                  controllerFile,
                  serviceFile: tracedService,
                  modelFile: tracedModel,
                  handler: handlerName,
                  middleware: middlewareList,
                  auth: isAuthRequired ? 'Required' : 'Public',
                  file: relPath,
                  line: pathNode.node.loc?.start.line || 1,
                  statuses: [
                    { code: 200, text: 'Success' },
                    { code: isAuthRequired ? 401 : 400, text: isAuthRequired ? 'Unauthorized' : 'Bad Request' },
                    { code: 500, text: 'Internal Server Error' },
                  ],
                });
              }
            }
          }
        },
      });
    } catch {}

    return results;
  }

  static traceService(controllerFile, fileImports) {
    if (!controllerFile) return null;
    const imports = fileImports.get(controllerFile);
    if (!imports) return null;

    for (const [_, target] of imports.entries()) {
      if (target.toLowerCase().includes('service')) return target;
    }
    return null;
  }

  static traceModel(controllerFile, serviceFile, fileImports) {
    const filesToSearch = [serviceFile, controllerFile].filter(Boolean);
    for (const f of filesToSearch) {
      const imports = fileImports.get(f);
      if (!imports) continue;
      for (const [_, target] of imports.entries()) {
        if (target.toLowerCase().includes('model') || target.toLowerCase().includes('schema')) {
          return target;
        }
      }
    }
    return null;
  }

  static combinePaths(prefix, subPath) {
    if (!prefix) return subPath.startsWith('/') ? subPath : `/${subPath}`;
    const p = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    const s = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const combined = `${p}${s}`;
    if (combined.length > 1 && combined.endsWith('/')) {
      return combined.slice(0, -1);
    }
    return combined;
  }

  static inferPrefixFromPath(relPath) {
    const base = path.basename(relPath, path.extname(relPath));
    const cleaned = base.replace(/routes?|controller|api/gi, '').replace(/[-_.]/g, '');
    if (!cleaned) return '/api';
    return `/api/${cleaned.toLowerCase()}`;
  }

  static determineGroup(endpointPath, relPath) {
    const parts = endpointPath.split('/').filter(Boolean);
    if (parts.length > 0 && parts[0] !== 'api') {
      return parts[0].toUpperCase();
    }
    if (parts.length > 1 && parts[0] === 'api') {
      return parts[1].toUpperCase();
    }
    const filename = path.basename(relPath, path.extname(relPath));
    return filename.replace(/routes?|controller/gi, '').toUpperCase() || 'GENERAL';
  }
}
