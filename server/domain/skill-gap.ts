import { Employee, SkillGapEvent } from '../../src/types/index.js';
import { calculatePythonSkillGaps } from './optimizer-client.js';

export function updateSkillGapsOnFailure(
  currentGaps: SkillGapEvent[],
  uncoveredSkills: string[],
  eventId?: string,
  employees: Employee[] = [],
): SkillGapEvent[] {
  const now = new Date().toISOString();
  const updatedGaps = [...currentGaps];

  for (const skill of uncoveredSkills) {
    const normalized = skill.trim().toLowerCase();
    const existingIndex = updatedGaps.findIndex((g) => g.skill_name === normalized);

    if (existingIndex >= 0) {
      const existing = updatedGaps[existingIndex];
      const newCount = existing.times_failed + 1;
      const relatedEvents = eventId && !existing.related_events.includes(eventId)
        ? [...existing.related_events, eventId]
        : existing.related_events;

      updatedGaps[existingIndex] = {
        ...existing,
        times_failed: newCount,
        related_events: relatedEvents,
        last_occurred: now,
        recommendation_strength: Math.min(1, Math.round((newCount / 5) * 100) / 100),
        suggested_hiring_priority: newCount >= 5 ? 1 : newCount >= 3 ? 2 : 3,
      };
    } else {
      updatedGaps.push({
        id: `gap-${normalized.replace(/[^a-z0-9]+/g, '-')}`,
        skill_name: normalized,
        times_failed: 1,
        related_events: eventId ? [eventId] : [],
        last_occurred: now,
        recommendation_strength: 0.2,
        suggested_hiring_priority: 3,
      });
    }
  }

  const frequencies = Object.fromEntries(updatedGaps.map((gap) => [gap.skill_name, gap.times_failed]));
  const activeEmployeeSkillCounts: Record<string, number> = {};
  for (const employee of employees.filter((item) => item.status === 'ACTIVE')) {
    for (const skill of employee.skills) {
      const name = skill.skill_name.trim().toLowerCase();
      activeEmployeeSkillCounts[name] = (activeEmployeeSkillCounts[name] || 0) + 1;
    }
  }
  const recommendations = calculatePythonSkillGaps(activeEmployeeSkillCounts, frequencies);
  if (recommendations) {
    for (const gap of updatedGaps) {
      const recommendation = recommendations.find((item) => item.skill_name === gap.skill_name);
      if (recommendation) {
        gap.recommendation_strength = Number(recommendation.recommendation_strength);
        gap.suggested_hiring_priority = Number(recommendation.suggested_hiring_priority) as 1 | 2 | 3;
      }
    }
  }

  return updatedGaps.sort((a, b) => a.suggested_hiring_priority - b.suggested_hiring_priority || b.times_failed - a.times_failed);
}
