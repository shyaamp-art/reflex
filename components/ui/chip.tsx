import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        // Spec Section 3 priority tokens
        critical: 'border-transparent bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold',
        high: 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 font-bold',
        medium: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold',
        low: 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        // Spec Section 3 status tokens
        unassigned: 'border-transparent bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        assigned: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
        in_progress: 'border-transparent bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
        on_hold: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
        completed: 'border-transparent bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, variant, ...props }: ChipProps) {
  return (
    <div className={cn(chipVariants({ variant }), className)} {...props} />
  );
}

export { Chip, chipVariants };
