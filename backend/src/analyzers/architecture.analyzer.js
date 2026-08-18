import path from 'path';

export class ArchitectureAnalyzer {
  /**
   * Synthesizes repository files, import graph, APIs, and DB models into developer-oriented software architecture groups and React Flow nodes.
   * @param {Object} scanResult Summary from repository scanner
   * @param {Object} depResult Output from DependencyAnalyzer
   * @param {Array} apiList Output from ApiAnalyzer
   * @param {Object} dbResult Output from DatabaseAnalyzer
   * @returns {Object} { modules, edges, layout }
   */
  static analyze(scanResult, depResult = { nodes: [], edges: [] }, apiList = [], dbResult = { tables: [], relations: [] }) {
    const files = scanResult.files || [];

    // Categorize files into developer software groups
    const buckets = {
      frontend: [],
      routes: [],
      controllers: [],
      services: [],
      models: [],
      middleware: [],
      utils: [],
      config: [],
      other: [],
    };

    for (const f of files) {
      const lower = f.toLowerCase();
      if (lower.includes('/routes/') || lower.includes('route.')) {
        buckets.routes.push(f);
      } else if (lower.includes('/controllers/') || lower.includes('controller.')) {
        buckets.controllers.push(f);
      } else if (lower.includes('/services/') || lower.includes('service.')) {
        buckets.services.push(f);
      } else if (lower.includes('/models/') || lower.includes('/schemas/') || lower.includes('model.')) {
        buckets.models.push(f);
      } else if (lower.includes('/middleware/')) {
        buckets.middleware.push(f);
      } else if (lower.includes('/utils/') || lower.includes('/helpers/')) {
        buckets.utils.push(f);
      } else if (lower.includes('/pages/') || lower.includes('/components/') || lower.includes('/hooks/')) {
        buckets.frontend.push(f);
      } else if (lower.includes('config') || lower.includes('.env')) {
        buckets.config.push(f);
      } else {
        buckets.other.push(f);
      }
    }

    const modules = [];
    const layout = {};

    // Calculate actual dependencies per bucket using AST depResult
    const depEdges = depResult.edges || [];
    const countDeps = (fileList) => {
      const set = new Set(fileList);
      let imports = 0;
      let dependents = 0;
      for (const e of depEdges) {
        if (set.has(e.source)) imports++;
        if (set.has(e.target)) dependents++;
      }
      return { imports, dependents };
    };

    // Y-coordinate vertical hierarchy
    let currentY = 40;
    const X_CENTER = 300;

    // 1. Frontend UI Group
    if (buckets.frontend.length > 0) {
      const stats = countDeps(buckets.frontend);
      modules.push({
        id: 'frontend',
        label: 'Frontend UI',
        layer: 'Frontend Layer',
        files: buckets.frontend.length,
        tech: scanResult.primaryLanguage === 'TypeScript' ? 'React + TypeScript' : 'React / Client UI',
        status: 'ok',
        responsibilities: ['Render views & components', 'Manage user interaction', 'Issue HTTP requests'],
        fileList: buckets.frontend,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['frontend'] = { x: X_CENTER, y: currentY };
      currentY += 140;
    }

    // 2. Middleware Group
    if (buckets.middleware.length > 0) {
      const stats = countDeps(buckets.middleware);
      modules.push({
        id: 'middleware',
        label: 'Middleware',
        layer: 'Request Pipeline',
        files: buckets.middleware.length,
        tech: 'Express Middleware',
        status: 'ok',
        responsibilities: ['Verify JWT authentication', 'Validate request payloads', 'Handle global errors'],
        fileList: buckets.middleware,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['middleware'] = { x: X_CENTER - 260, y: currentY };
    }

    // 3. Routes / API Group
    if (buckets.routes.length > 0 || apiList.length > 0) {
      const stats = countDeps(buckets.routes);
      modules.push({
        id: 'routes',
        label: 'Routes / API',
        layer: 'API Endpoint Layer',
        files: buckets.routes.length || 1,
        tech: 'Express Router',
        status: 'ok',
        responsibilities: ['Mount HTTP endpoints', 'Parse URL route parameters', 'Dispatch requests'],
        fileList: buckets.routes,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['routes'] = { x: X_CENTER, y: currentY };
      currentY += 140;
    }

    // 4. Controllers Group
    if (buckets.controllers.length > 0) {
      const stats = countDeps(buckets.controllers);
      modules.push({
        id: 'controllers',
        label: 'Controllers',
        layer: 'Application Handlers',
        files: buckets.controllers.length,
        tech: 'Express Handlers',
        status: 'ok',
        responsibilities: ['Receive request body/params', 'Invoke business services', 'Return JSON responses'],
        fileList: buckets.controllers,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['controllers'] = { x: X_CENTER, y: currentY };
      currentY += 140;
    }

    // 5. Services Group
    if (buckets.services.length > 0) {
      const stats = countDeps(buckets.services);
      modules.push({
        id: 'services',
        label: 'Services',
        layer: 'Domain Logic Layer',
        files: buckets.services.length,
        tech: 'Domain Business Logic',
        status: 'ok',
        responsibilities: ['Execute core domain logic', 'Perform calculations', 'Coordinate data access'],
        fileList: buckets.services,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['services'] = { x: X_CENTER, y: currentY };
      currentY += 140;
    }

    // 6. Models Group
    if (buckets.models.length > 0 || dbResult.tables.length > 0) {
      const stats = countDeps(buckets.models);
      modules.push({
        id: 'models',
        label: 'Models / Data Access',
        layer: 'Persistence Schemas',
        files: buckets.models.length || dbResult.tables.length,
        tech: 'Mongoose / Schemas',
        status: 'ok',
        responsibilities: ['Define database schemas', 'Enforce field validation', 'Manage query methods'],
        fileList: buckets.models,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['models'] = { x: X_CENTER, y: currentY };
      currentY += 140;
    }

    // 7. Database Group
    if (buckets.models.length > 0 || dbResult.tables.length > 0) {
      modules.push({
        id: 'database',
        label: 'Database',
        layer: 'Storage Engine',
        files: dbResult.tables.length || 1,
        tech: 'MongoDB Collections',
        status: 'ok',
        responsibilities: ['Store persistent documents', 'Manage indexes', 'Execute queries'],
        fileList: dbResult.tables.map((t) => `${t.name} collection`),
        dependencies: 0,
        dependents: buckets.models.length,
        group: 'overview',
      });
      layout['database'] = { x: X_CENTER, y: currentY };
    }

    // 8. Utilities Group
    if (buckets.utils.length > 0) {
      const stats = countDeps(buckets.utils);
      modules.push({
        id: 'utils',
        label: 'Utilities',
        layer: 'Shared Utilities',
        files: buckets.utils.length,
        tech: 'Helper Modules',
        status: 'ok',
        responsibilities: ['Shared formatting', 'Validation helpers', 'Logging & error helpers'],
        fileList: buckets.utils,
        dependencies: stats.imports,
        dependents: stats.dependents,
        group: 'overview',
      });
      layout['utils'] = { x: X_CENTER + 260, y: 320 };
    }

    // Overview Edges
    const edges = [];
    if (layout['frontend'] && layout['routes']) {
      edges.push({ id: 'arch-fe->routes', source: 'frontend', target: 'routes', label: 'HTTP requests', group: 'overview' });
    }
    if (layout['middleware'] && layout['routes']) {
      edges.push({ id: 'arch-mw->routes', source: 'middleware', target: 'routes', label: 'validates', group: 'overview' });
    }
    if (layout['routes'] && layout['controllers']) {
      edges.push({ id: 'arch-routes->ctrl', source: 'routes', target: 'controllers', label: 'dispatches to', group: 'overview' });
    }
    if (layout['controllers'] && layout['services']) {
      edges.push({ id: 'arch-ctrl->svc', source: 'controllers', target: 'services', label: 'invokes', group: 'overview' });
    } else if (layout['controllers'] && layout['models']) {
      edges.push({ id: 'arch-ctrl->model', source: 'controllers', target: 'models', label: 'queries', group: 'overview' });
    }
    if (layout['services'] && layout['models']) {
      edges.push({ id: 'arch-svc->model', source: 'services', target: 'models', label: 'uses model', group: 'overview' });
    }
    if (layout['models'] && layout['database']) {
      edges.push({ id: 'arch-model->db', source: 'models', target: 'database', label: 'persists in', group: 'overview' });
    }

    // --- VIEW 2: MODULES VIEW ---
    // Generate individual file nodes grouped in vertical columns
    const categoryColumns = [
      { key: 'routes', label: 'Routes', files: buckets.routes, x: 50 },
      { key: 'controllers', label: 'Controllers', files: buckets.controllers, x: 300 },
      { key: 'services', label: 'Services', files: buckets.services, x: 550 },
      { key: 'models', label: 'Models', files: buckets.models, x: 800 },
    ];

    categoryColumns.forEach((col) => {
      col.files.forEach((f, idx) => {
        const id = `mod-${f}`;
        const basename = path.basename(f);
        modules.push({
          id,
          label: basename,
          layer: col.label,
          files: 1,
          tech: col.label,
          status: 'ok',
          responsibilities: [`Source file: ${f}`],
          fileList: [f],
          dependencies: 0,
          dependents: 0,
          group: 'modules',
        });
        layout[id] = { x: col.x, y: idx * 90 + 40 };
      });
    });

    // Modules edges from AST depResult
    depEdges.forEach((e, i) => {
      const srcId = `mod-${e.source}`;
      const tgtId = `mod-${e.target}`;
      if (layout[srcId] && layout[tgtId]) {
        edges.push({
          id: `mod-edge-${i}`,
          source: srcId,
          target: tgtId,
          label: 'imports',
          group: 'modules',
        });
      }
    });

    // --- VIEW 3: DATA FLOW VIEW ---
    // Generate request data flow paths from detected APIs
    apiList.slice(0, 8).forEach((api, idx) => {
      const routeNodeId = `df-route-${idx}`;
      const ctrlNodeId = `df-ctrl-${idx}`;
      const svcNodeId = `df-svc-${idx}`;
      const modelNodeId = `df-model-${idx}`;
      const yPos = idx * 120 + 40;

      modules.push({
        id: routeNodeId,
        label: `${api.method} ${api.path}`,
        layer: 'Route Endpoint',
        files: 1,
        tech: api.file,
        status: 'ok',
        responsibilities: [`Handler: ${api.handler}`, `File: ${api.file}:${api.line}`],
        fileList: [api.file],
        dependencies: 1,
        dependents: 0,
        group: 'dataflow',
      });
      layout[routeNodeId] = { x: 50, y: yPos };

      if (api.controllerFile) {
        modules.push({
          id: ctrlNodeId,
          label: path.basename(api.controllerFile),
          layer: 'Controller',
          files: 1,
          tech: api.handler,
          status: 'ok',
          responsibilities: [`Controller file: ${api.controllerFile}`],
          fileList: [api.controllerFile],
          dependencies: 1,
          dependents: 1,
          group: 'dataflow',
        });
        layout[ctrlNodeId] = { x: 320, y: yPos };
        edges.push({ id: `df-edge-r->c-${idx}`, source: routeNodeId, target: ctrlNodeId, label: 'calls', group: 'dataflow' });
      }

      if (api.serviceFile) {
        modules.push({
          id: svcNodeId,
          label: path.basename(api.serviceFile),
          layer: 'Service',
          files: 1,
          tech: 'Business Service',
          status: 'ok',
          responsibilities: [`Service file: ${api.serviceFile}`],
          fileList: [api.serviceFile],
          dependencies: 1,
          dependents: 1,
          group: 'dataflow',
        });
        layout[svcNodeId] = { x: 580, y: yPos };
        const prevId = layout[ctrlNodeId] ? ctrlNodeId : routeNodeId;
        edges.push({ id: `df-edge-c->s-${idx}`, source: prevId, target: svcNodeId, label: 'invokes', group: 'dataflow' });
      }

      if (api.modelFile) {
        modules.push({
          id: modelNodeId,
          label: path.basename(api.modelFile),
          layer: 'Model',
          files: 1,
          tech: 'Schema / Model',
          status: 'ok',
          responsibilities: [`Model file: ${api.modelFile}`],
          fileList: [api.modelFile],
          dependencies: 1,
          dependents: 1,
          group: 'dataflow',
        });
        layout[modelNodeId] = { x: 840, y: yPos };
        const prevId = layout[svcNodeId] ? svcNodeId : (layout[ctrlNodeId] ? ctrlNodeId : routeNodeId);
        edges.push({ id: `df-edge-s->m-${idx}`, source: prevId, target: modelNodeId, label: 'queries', group: 'dataflow' });
      }
    });

    return {
      modules,
      edges,
      layout,
    };
  }
}
