export type AnalysisProgressProps = {
  message?: string
}

function AnalysisProgress({ message = 'Analyzing video...' }: AnalysisProgressProps) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-gray-50 p-4 text-gray-700">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" aria-hidden />
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default AnalysisProgress
