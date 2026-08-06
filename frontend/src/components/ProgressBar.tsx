interface ProgressBarProps {
  value: number   // 0-100
  className?: string
  showLabel?: boolean
  color?: string
}

export default function ProgressBar({ value, className = '', showLabel = true, color }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const barColor = color || (pct === 100 ? 'bg-green-500' : pct > 60 ? 'bg-brand-500' : 'bg-blue-400')

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <span className="text-xs font-medium text-slate-500">{pct}% complete</span>
        )}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
