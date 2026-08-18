import { BaseAIProvider } from './provider.interface.js';

export class FallbackAIProvider extends BaseAIProvider {
  async generateInsights(projectContext) {
    const insights = [];
    let counter = 1;

    // 1. Architecture Observation
    const archModulesCount = projectContext.architecture?.modules?.length || 0;
    if (archModulesCount > 0) {
      insights.push({
        index: String(counter++).padStart(2, '0'),
        title: 'Architectural Layer Separation',
        body: `Detected ${archModulesCount} distinct architectural layers. The project exhibits clean separation across presentation, application logic, and persistence layers.`,
        meta: [
          { label: 'Modules', value: `${archModulesCount} layers` },
          { label: 'Pattern', value: 'Layered Architecture' },
        ],
        tone: 'ok',
        trace: projectContext.files?.slice(0, 3) || [],
      });
    }

    // 2. High Coupling Observation
    const internalDeps = projectContext.dependencies?.internalDependencies || [];
    const importCounts = {};
    for (const dep of internalDeps) {
      importCounts[dep.source] = (importCounts[dep.source] || 0) + 1;
    }

    let maxCoupledFile = '';
    let maxCount = 0;
    for (const [file, cnt] of Object.entries(importCounts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxCoupledFile = file;
      }
    }

    if (maxCount >= 4) {
      insights.push({
        index: String(counter++).padStart(2, '0'),
        title: `High Coupling in ${maxCoupledFile}`,
        body: `The file '${maxCoupledFile}' directly imports ${maxCount} internal modules. High coupling may increase regression risks during refactoring.`,
        meta: [
          { label: 'Dependencies', value: `${maxCount} imports` },
          { label: 'Severity', value: 'Medium' },
        ],
        tone: 'warn',
        trace: [maxCoupledFile],
      });
    }

    // 3. API Surface Observation
    const apiCount = projectContext.apis?.length || 0;
    if (apiCount > 0) {
      insights.push({
        index: String(counter++).padStart(2, '0'),
        title: `API Route Surface Area`,
        body: `Identified ${apiCount} static Express HTTP endpoints across ${projectContext.files?.filter((f) => f.includes('route')).length || 1} route handlers.`,
        meta: [
          { label: 'Endpoints', value: `${apiCount} routes` },
          { label: 'Framework', value: 'Express.js' },
        ],
        tone: 'info',
        trace: projectContext.apis?.slice(0, 3).map((a) => a.file) || [],
      });
    }

    // 4. Database Schema Observation
    const tablesCount = projectContext.database?.tables?.length || 0;
    if (tablesCount > 0) {
      insights.push({
        index: String(counter++).padStart(2, '0'),
        title: `Mongoose Model Schema Overview`,
        body: `Extracted ${tablesCount} database schemas with ${projectContext.database?.relations?.length || 0} relational foreign-key references.`,
        meta: [
          { label: 'Models', value: `${tablesCount} schemas` },
          { label: 'ORM/ODM', value: 'Mongoose' },
        ],
        tone: 'ok',
        trace: projectContext.database?.tables?.map((t) => t.file).filter(Boolean) || [],
      });
    }

    // Default insight if repo is small
    if (insights.length === 0) {
      insights.push({
        index: '01',
        title: 'Repository Structure Analyzed',
        body: `Successfully indexed ${projectContext.fileCount || 0} files and ${projectContext.directoryCount || 0} directories in ${projectContext.name}.`,
        meta: [
          { label: 'Files', value: `${projectContext.fileCount || 0}` },
          { label: 'Language', value: projectContext.primaryLanguage || 'JavaScript' },
        ],
        tone: 'info',
        trace: [],
      });
    }

    return insights;
  }

  async askQuestion(question, retrievalContext) {
    const qLower = question.toLowerCase();

    // Trace files mentioned in context
    const filesCited = retrievalContext.relevantFiles || [];
    const apisCited = retrievalContext.relevantApis || [];

    let summary = `Based on the static analysis of **${retrievalContext.projectName || 'the repository'}**, `;

    if (qLower.includes('auth') || qLower.includes('login')) {
      summary += `authentication logic is located in the routes and middleware. Express endpoints handle incoming credentials and token verification.`;
    } else if (qLower.includes('database') || qLower.includes('model') || qLower.includes('schema')) {
      summary += `database access is defined through Mongoose model schemas matching the domain entities.`;
    } else if (qLower.includes('api') || qLower.includes('route') || qLower.includes('endpoint')) {
      summary += `the application mounts ${retrievalContext.apiCount || 0} HTTP endpoints using Express routers.`;
    } else {
      summary += `here are the primary modules and symbols matching your question.`;
    }

    const trace = filesCited.map((f, idx) => ({
      path: f,
      line: 1,
      note: `Relevant module ${idx + 1}`,
    }));

    return {
      question,
      summary,
      trace,
      snippet: retrievalContext.topSnippet || undefined,
      related: [
        'Which files interact with the main data models?',
        'Show me the full flow from API route to database.',
        'Which modules have the highest number of internal dependencies?',
      ],
    };
  }
}
