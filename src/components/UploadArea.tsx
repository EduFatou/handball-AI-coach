export type UploadAreaProps = {
  onFileSelected?: (file: File) => void
  accept?: string
  disabled?: boolean
}

function UploadArea({ onFileSelected, accept = 'video/*', disabled = false }: UploadAreaProps) {
  return (
    <section className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">
      <div className="mx-auto max-w-md">
        <p className="text-sm">UploadArea component stub</p>
        <p className="mt-1 text-xs text-gray-500">Accepts: {accept} {disabled ? '(disabled)' : ''}</p>
      </div>
    </section>
  )
}

export default UploadArea
