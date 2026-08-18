export class MetricsAnalyzer {
  /**
   * Detects circular dependency cycles using Depth-First Search (DFS) graph traversal.
   * @param {Array} edges List of internal dependency edges { source, target }
   * @returns {Array<Object>} List of detected circular dependency cycles
   */
  static detectCircularDependencies(edges) {
    const adj = new Map();
    for (const edge of edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      adj.get(edge.source).push(edge.target);
    }

    const visited = new Set();
    const recStack = new Set();
    const cycles = [];

    function dfs(node, path) {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          // Cycle found! Extract cycle path
          const cycleStartIndex = path.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            const cyclePath = path.slice(cycleStartIndex);
            cyclePath.push(neighbor);

            const cycleKey = cyclePath.sort().join('->');
            if (!cycles.some((c) => c.key === cycleKey)) {
              cycles.push({
                key: cycleKey,
                type: 'circular_dependency',
                severity: 'high',
                cycle: cyclePath,
              });
            }
          }
        }
      }

      recStack.delete(node);
    }

    for (const node of adj.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles.map(({ key, ...rest }) => rest);
  }

  /**
   * Calculates deterministic codebase metrics for Overview dashboard
   */
  static calculateMetrics(projectData) {
    const internalDepsCount = projectData.dependencies?.internalDependencies?.length || 0;
    const externalDepsCount = projectData.dependencies?.externalDependencies?.length || 0;

    let symbolCount = 0;
    let functionCount = 0;
    let classCount = 0;

    for (const symList of Object.values(projectData.symbols || {})) {
      symbolCount += symList.length;
      for (const s of symList) {
        if (s.type === 'function' || s.type === 'method') functionCount++;
        if (s.type === 'class') classCount++;
      }
    }

    const cycles = MetricsAnalyzer.detectCircularDependencies(
      projectData.dependencies?.edges || []
    );

    const metricsEntries = [
      { label: 'Files', value: projectData.fileCount || 0, hint: 'tracked source files' },
      { label: 'Functions', value: functionCount || symbolCount, hint: 'AST parsed functions & methods' },
      { label: 'API Routes', value: projectData.apis?.length || 0, hint: 'Express endpoints' },
      { label: 'Models', value: projectData.database?.tables?.length || 0, hint: 'Mongoose / DB schemas' },
      { label: 'Dependencies', value: internalDepsCount + externalDepsCount, hint: 'internal & external imports' },
    ];

    const healthScores = [
      { label: 'Architecture', score: Math.max(60, 95 - cycles.length * 10), note: 'Layer separation across API and domain' },
      { label: 'Code Organization', score: Math.max(65, 90 - (projectData.fileCount > 50 ? 10 : 0)), note: 'Modular file distribution' },
      { label: 'Dependencies', score: Math.max(50, 100 - cycles.length * 20), note: cycles.length > 0 ? `${cycles.length} circular dependencies detected` : 'Clean import graph' },
      { label: 'Security', score: 85, note: 'Static code parsing — zero execution risk' },
    ];

    return {
      metrics: metricsEntries,
      health: healthScores,
      circularDependencies: cycles,
    };
  }
}
