interface ConfidenceScoreProps {
  score: number;
  className?: string;
  showProgress?: boolean;
}

export function ConfidenceScore({
  score,
  className = '',
  showProgress = true,
}: ConfidenceScoreProps) {
  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBg = (val: number) => {
    if (val >= 90) return 'bg-emerald-500';
    if (val >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-muted-foreground">Confidence Score</span>
        <span className={getScoreColor(score)}>{score}%</span>
      </div>
      {showProgress && (
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBg(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
