import { postJson, request } from "./client";
import {
  askAnswers,
  issues,
  observations,
  patterns,
  recommendations,
  suggestedQuestions,
} from "@/mock/insights";
import type { AskAnswer, Insight } from "@/types";

export function getInsights(): Promise<{
  observations: Insight[];
  issues: Insight[];
  recommendations: Insight[];
  patterns: { name: string; note: string }[];
}> {
  return request("/projects/:projectId/insights", {
    observations,
    issues,
    recommendations,
    patterns,
  }).then((res: any) => {
    if (Array.isArray(res)) {
      return {
        observations: res,
        issues: [],
        recommendations: [],
        patterns: [],
      };
    }
    return res;
  });
}

export function getSuggestedQuestions(): Promise<string[]> {
  return request("/ai/questions", suggestedQuestions);
}

export async function askCodePilot(question: string): Promise<AskAnswer> {
  try {
    const res = await postJson<{ success: boolean; answer: AskAnswer }>(
      "/projects/:projectId/ask",
      { question }
    );
    if (res && res.answer) {
      return res.answer;
    }
  } catch {
    // Fallback to mock search if backend unavailable
  }

  const normalized = question.toLowerCase();
  const scored = askAnswers
    .map((answer) => {
      const words = answer.question
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((w) => w.length > 3);
      const score = words.filter((w) => normalized.includes(w)).length;
      return { answer, score };
    })
    .sort((a, b) => b.score - a.score);

  const fallback = askAnswers[1] as AskAnswer;
  const best: AskAnswer = scored[0] && scored[0].score > 0 ? scored[0].answer : fallback;
  return { ...best, question };
}