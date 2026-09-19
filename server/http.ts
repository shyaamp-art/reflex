import { Request, Response } from 'express';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function fail(status: number, code: string, message: string): never {
  throw new ApiError(status, code, message);
}

export function sendError(res: Response, error: unknown): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  const status = /not found/i.test(message) ? 404 : /already|pending state|inactive|duplicate|stale/i.test(message) ? 409 : /validation|required|invalid|exceed|ineligible|no feasible|must_have|hard constraints/i.test(message) ? 422 : 500;
  res.status(status).json({ error: { code: status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : status === 422 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message } });
}

export function stringValue(value: unknown, field: string, required = true): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) fail(422, 'VALIDATION_ERROR', `${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string' || !value.trim()) fail(422, 'VALIDATION_ERROR', `${field} must be a non-empty string`);
  return value.trim();
}

export function isoDate(value: unknown, field: string): string {
  const text = stringValue(value, field)!;
  if (Number.isNaN(Date.parse(text))) fail(422, 'VALIDATION_ERROR', `${field} must be a valid ISO date`);
  return text;
}

export function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string, fallback?: T): T {
  const result = value === undefined && fallback !== undefined ? fallback : value;
  if (typeof result !== 'string' || !allowed.includes(result as T)) {
    fail(422, 'VALIDATION_ERROR', `${field} must be one of: ${allowed.join(', ')}`);
  }
  return result as T;
}

export function requireBodyObject(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    fail(422, 'VALIDATION_ERROR', 'Request body must be a JSON object');
  }
  return req.body as Record<string, unknown>;
}
