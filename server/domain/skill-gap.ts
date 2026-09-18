import { SkillGapEvent } from '../../src/types/index.js';

export function updateSkillGapsOnFailure(
  currentGaps: SkillGapEvent[],
  uncoveredSkills: string[],
  eventId?: string
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

  return updatedGaps.sort((a, b) => a.suggested_hiring_priority - b.suggested_hiring_priority || b.times_failed - a.times_failed);
}
