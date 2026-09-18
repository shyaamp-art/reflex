import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatShortId(uuid: string): string {
  if (!uuid) return '';
  return uuid.slice(0, 8);
}
