'use client';

import { cn } from '@/lib/utils';
import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
  glowColor?: 'default' | 'green' | 'red' | 'amber' | 'blue';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const glowStyles = {
  default: 'card-glow',
  green: 'card-glow-green',
  red: 'card-glow-red',
  amber: 'card-glow-amber',
  blue: 'card-glow-blue',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, glow = false, glowColor = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          interactive ? 'card-3d cursor-pointer' : 'rounded-2xl bg-white border border-slate-100/80 shadow-card transition-all duration-300',
          glow && glowStyles[glowColor],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pb-3', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-500', className)} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-4 mt-4 border-t border-slate-100', className)} {...props}>{children}</div>;
}
