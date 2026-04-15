import Image from 'next/image'
import type { ComponentPropsWithoutRef } from 'react'

const DEFAULT_IMAGE_WIDTH = 1200
const DEFAULT_IMAGE_HEIGHT = 630

type MdxImageProps = ComponentPropsWithoutRef<'img'>

export const mdxComponents = {
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a className='text-primary underline underline-offset-4 hover:text-primary/80' {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className='text-foreground/90 leading-7' {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-sm' {...props} />
  ),
  img: ({ src, alt = '', width, height, ...props }: MdxImageProps) => {
    if (typeof src !== 'string' || src.length === 0) {
      return null
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={Number(width) || DEFAULT_IMAGE_WIDTH}
        height={Number(height) || DEFAULT_IMAGE_HEIGHT}
        className='h-auto w-full rounded-md'
        sizes='(min-width: 1024px) 960px, 100vw'
        {...props}
      />
    )
  },
}
