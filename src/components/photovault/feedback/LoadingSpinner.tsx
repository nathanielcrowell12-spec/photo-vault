interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export default function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  color = 'blue'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    purple: 'border-purple-600',
    orange: 'border-orange-600'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} mx-auto mb-4`}
        ></div>
        <p className="text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
  )
}
