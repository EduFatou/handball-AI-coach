export type AnalysisProgressProps = {
  message?: string
}

function AnalysisProgress({ message = 'Analyzing video...' }: AnalysisProgressProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 text-gray-700">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#8f2668] border-t-transparent" aria-hidden />
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default AnalysisProgress
