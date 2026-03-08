'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

type FileDropzoneProps = {
  onFile: (file: File) => void
  accept?: Record<string, string[]>
  label?: string
  sublabel?: string
}

export function FileDropzone({
  onFile,
  accept = { 'text/csv': ['.csv'] },
  label = 'Drag & drop a file, or click to browse',
  sublabel,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
    >
      <input {...getInputProps()} />
      <svg
        className='mb-3 h-10 w-10 text-muted-foreground'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
        />
      </svg>
      <p className='text-sm text-muted-foreground'>
        {isDragActive ? 'Drop your file here' : label}
      </p>
      {sublabel && <p className='mt-1 text-xs text-muted-foreground/70'>{sublabel}</p>}
    </div>
  )
}
