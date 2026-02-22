'use client';

import { useEffect, useState } from 'react';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): { stroke: string; glow: string; text: string; bg: string } {
  if (score >= 80) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.3)', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 60) return { stroke: '#6366f1', glow: 'rgba(99,102,241,0.3)', text: 'text-brand-600', bg: 'bg-brand-50' };
  if (score >= 40) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.3)', text: 'text-red-600', bg: 'bg-red-50' };
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 25) return 'Poor';
  return 'Critical';
}

export function ScoreCircle({ score, size = 120, strokeWidth = 8, label, showLabel = true, className }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const colors = getScoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className || ''}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-circle">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Score circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colors.text}`}>{Math.round(animatedScore)}</span>
          {showLabel && (
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {label || getScoreLabel(score)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScoreCircleSmall({ score, size = 48 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="score-circle">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={colors.stroke} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 4px ${colors.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${colors.text}`}>{score}</span>
      </div>
    </div>
  );
}
