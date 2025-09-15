export type AnalysisProgressProps = {
  message?: string
}

function AnalysisProgress({ message = 'Analyzing video...' }: AnalysisProgressProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/30 p-8 shadow-lg">
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#8f2668]/5 via-[#e5204c]/5 to-[#8f2668]/5 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>
      
      <div className="relative flex items-center justify-center gap-4 text-gray-700">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-[#8f2668] border-r-[#e5204c]" />
          {/* Inner pulsing circle */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8f2668]/10 to-[#e5204c]/10">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#8f2668] to-[#e5204c] animate-pulse" />
          </div>
        </div>
        
        <div className="text-center sm:text-left">
          <span className="block text-lg font-semibold text-gray-900">{message}</span>
          <span className="block text-sm text-gray-600 mt-1">This may take a few moments...</span>
        </div>
      </div>
    </div>
  )
}

export default AnalysisProgress
