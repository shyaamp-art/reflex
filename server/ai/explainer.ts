import { GoogleGenAI, Type } from '@google/genai';
import { CandidateScore, Task } from '../../src/types/index.js';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ExplainerInput {
  task: Pick<Task, 'title' | 'priority' | 'estimated_effort' | 'sla_deadline' | 'required_location'>;
  topCandidates: CandidateScore[];
  selectedCandidates: CandidateScore[];
  contextType: 'INITIAL_ALLOCATION' | 'REALLOCATION' | 'PRIORITY_REALLOCATION';
}

export interface ExplainerOutput {
  summary: string;
  candidate_reasons: { employee_id: string; reason: string }[];
  risk_flags: string[];
  source: 'gemini' | 'deterministic';
  model_used?: string;
}

export async function generateExplanationWithGemini(input: ExplainerInput): Promise<ExplainerOutput> {
  const { task, topCandidates, selectedCandidates, contextType } = input;

  // High-fidelity deterministic fallback defaults
  const fallbackSummary = selectedCandidates.length > 0
    ? `Recommended ${selectedCandidates.map((c) => c.employeeName).join(' & ')} for "${task.title}". The deterministic engine verified 100% MUST_HAVE skill coverage, safe projected workloads (avg ${Math.round(selectedCandidates.reduce((acc, c) => acc + c.projectedWorkload, 0) / selectedCandidates.length)}%), and adequate SLA headroom.`
    : `No feasible candidate satisfies all hard constraints (skills, availability, workload limits) for "${task.title}".`;

  const fallbackReasons = topCandidates.map((c) => ({
    employee_id: c.employeeId,
    reason: c.reason,
  }));

  const fallbackRiskFlags: string[] = [];
  for (const c of selectedCandidates) {
    if (c.projectedWorkload > 85) {
      fallbackRiskFlags.push(`${c.employeeName} will operate near soft capacity threshold (${c.projectedWorkload}%).`);
    }
  }

  const ai = getGenAI();
  if (!ai) {
    return {
      summary: fallbackSummary,
      candidate_reasons: fallbackReasons,
      risk_flags: fallbackRiskFlags,
      source: 'deterministic',
    };
  }

  const prompt = `You are the Reflex Decision Explainability Agent. Explain why the following candidate(s) were chosen by the deterministic 6-factor workforce engine.
Strict Rules:
1. Do not hallucinate or change numbers or scores. Use only the factual candidate and task data provided below.
2. Keep explanations professional, crisp, and operational for engineering leadership.
3. Highlight any capacity or SLA risks identified in the data.

Task Context:
- Title: ${task.title}
- Priority: ${task.priority}
- Estimated Effort: ${task.estimated_effort} hours
- SLA Deadline: ${task.sla_deadline}
- Work Mode: ${task.required_location}
- Context: ${contextType}

Selected Candidates:
${JSON.stringify(selectedCandidates.map(c => ({
  name: c.employeeName,
  role: c.roleTitle,
  seniority: c.seniority,
  score: c.score,
  breakdown: c.breakdown,
  projectedWorkload: c.projectedWorkload,
})), null, 2)}

Top Candidates Evaluated:
${JSON.stringify(topCandidates.map(c => ({
  id: c.employeeId,
  name: c.employeeName,
  eligible: c.eligible,
  score: c.score,
  rejectionReasons: c.rejectionReasons,
})), null, 2)}
`;

  // Candidate models: primary basic text model, followed by lightweight high-availability flash-lite
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of candidateModels) {
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 4500);

      const geminiCall = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          abortSignal: abortController.signal,
          systemInstruction: 'You are Reflex AI Explanation Layer. Output JSON only according to the specified schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'Executive summary explaining why the selected team is optimal.' },
              risk_flags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Potential operational caveats or workload proximity flags.',
              },
              candidate_reasons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    employee_id: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['employee_id', 'reason'],
                },
              },
            },
            required: ['summary', 'risk_flags', 'candidate_reasons'],
          },
        },
      });

      const result = await geminiCall;
      clearTimeout(timeoutId);

      if (result && result.text) {
        const parsed = JSON.parse(result.text.trim());
        return {
          summary: parsed.summary || fallbackSummary,
          candidate_reasons: Array.isArray(parsed.candidate_reasons) ? parsed.candidate_reasons : fallbackReasons,
          risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : fallbackRiskFlags,
          source: 'gemini',
          model_used: model,
        };
      }
    } catch (err: any) {
      const is503 = err?.status === 503 || err?.code === 503 || String(err?.message || '').includes('503') || String(err?.message || '').includes('high demand');
      const is429 = err?.status === 429 || err?.code === 429 || String(err?.message || '').includes('429');
      const isAbort = err?.name === 'AbortError' || String(err?.message || '').includes('abort');

      if (is503 || is429 || isAbort) {
        // High demand or temporary spike; note cleanly without triggering noisy stack trace warnings
        console.info(`[Reflex AI] Model ${model} unavailable (${is503 ? '503 high demand' : is429 ? '429 rate limit' : 'timeout'}); falling back...`);
        // Brief pause before trying fallback model
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }

      console.info(`[Reflex AI] Model ${model} encountered error: ${err?.message || 'unknown'}. Attempting fallback...`);
    }
  }

  // If all models are experiencing temporary demand spikes, deliver the verified deterministic allocation reasoning seamlessly
  return {
    summary: fallbackSummary,
    candidate_reasons: fallbackReasons,
    risk_flags: fallbackRiskFlags,
    source: 'deterministic',
  };
}
