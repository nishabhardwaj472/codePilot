import { SearchService } from './search.service.js';
import { FileService } from './file.service.js';
import { AIService } from './ai/ai.service.js';
import { ProjectStore } from './project.store.js';

export class AskService {
  /**
   * Processes user Q&A request with lightweight RAG context retrieval
   */
  static async ask(projectId, question) {
    const project = ProjectStore.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // 1. Search index for relevant search terms in question
    const searchResults = SearchService.search(projectId, question);

    const relevantFiles = Array.from(
      new Set(searchResults.map((r) => r.file).filter(Boolean))
    ).slice(0, 5);

    const relevantApis = (project.apis || [])
      .filter((api) => question.toLowerCase().includes(api.path.toLowerCase()) || question.toLowerCase().includes(api.handler.toLowerCase()))
      .slice(0, 3);

    // 2. Fetch top source code snippet if available
    let topSnippet = undefined;
    if (relevantFiles.length > 0) {
      try {
        const fileData = FileService.getFileSource(projectId, relevantFiles[0]);
        topSnippet = {
          path: fileData.path,
          code: fileData.code.split('\n').slice(0, 40).join('\n'), // top 40 lines
        };
      } catch {
        // Snippet retrieval fallback
      }
    }

    const relevantModels = (project.database?.tables || []).map(t => t.name);

    const retrievalContext = {
      projectId,
      projectName: project.name,
      apiCount: project.apis?.length || 0,
      projectFiles: project.files || [],
      relevantFiles,
      relevantApis,
      relevantModels,
      topSnippet,
    };

    // 3. Delegate to AI Service / Provider
    const answer = await AIService.askQuestion(question, retrievalContext);

    if (!answer.snippet && topSnippet) {
      answer.snippet = topSnippet;
    }

    return answer;
  }

  /**
   * Code Flow Tracer for explaining HTTP endpoints & execution flows
   */
  static explainFlow(projectId, endpointPath) {
    const project = ProjectStore.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const matchingApi = (project.apis || []).find(
      (a) => a.path.toLowerCase() === endpointPath.toLowerCase()
    );

    const steps = [];
    if (matchingApi) {
      steps.push({
        step: 1,
        layer: 'API Route',
        label: `${matchingApi.method} ${matchingApi.path}`,
        file: matchingApi.file,
        line: matchingApi.line,
        detail: `Handled in ${matchingApi.controller}`,
      });
    }

    // Controller step
    const ctrlFile = (project.files || []).find(
      (f) => f.toLowerCase().includes('controller')
    );
    if (ctrlFile) {
      steps.push({
        step: steps.length + 1,
        layer: 'Controller',
        label: 'Controller Handler',
        file: ctrlFile,
        detail: 'Validates input payload and dispatches to domain service',
      });
    }

    // Service step
    const svcFile = (project.files || []).find((f) => f.toLowerCase().includes('service'));
    if (svcFile) {
      steps.push({
        step: steps.length + 1,
        layer: 'Service',
        label: 'Domain Business Logic',
        file: svcFile,
        detail: 'Executes core application logic and data transformation',
      });
    }

    // Model step
    const modelTable = project.database?.tables?.[0];
    if (modelTable) {
      steps.push({
        step: steps.length + 1,
        layer: 'Database Model',
        label: `${modelTable.name} Schema`,
        file: modelTable.file,
        detail: `Persists data to ${modelTable.collection} collection`,
      });
    }

    return {
      endpoint: endpointPath,
      flowSteps: steps,
      explanation: `Execution flow for ${endpointPath} traverses ${steps.length} architectural layers from route handler to database persistence.`,
    };
  }
}
