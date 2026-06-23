'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import { DEFAULT_TEMPLATE_ID, type TemplateMeta } from '~/templates/catalog'
import { api } from '~/trpc/react'

type TemplatePickerProps = Readonly<{
  templates: TemplateMeta[]
  currentTemplateId: string | null
}>

export function TemplatePicker({ templates, currentTemplateId }: TemplatePickerProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(currentTemplateId ?? DEFAULT_TEMPLATE_ID)

  const updateTemplate = api.website.updateTemplate.useMutation({
    onError: () => {
      setSelectedId(currentTemplateId ?? DEFAULT_TEMPLATE_ID)
      toast.error('Unable to update your website template.')
    },
    onSuccess: (updatedWebsite) => {
      setSelectedId(updatedWebsite.templateId ?? DEFAULT_TEMPLATE_ID)
      toast.success('Website template updated')
      router.refresh()
    },
  })

  const selectTemplate = (templateId: string) => {
    if (templateId === selectedId || updateTemplate.isPending) {
      return
    }
    setSelectedId(templateId)
    updateTemplate.mutate({ templateId })
  }

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardHeader className='space-y-3'>
        <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
          Template
        </p>
        <CardTitle className='font-serif text-2xl text-foreground'>
          Choose a look for your wedding
        </CardTitle>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          A template styles your whole guest experience — website, save the date, invitation, and
          RSVP — with one coherent palette and typography. Switch any time.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className='grid gap-4 sm:grid-cols-2'
          role='radiogroup'
          aria-label='Wedding website template'
        >
          {templates.map((template) => {
            const isSelected = template.id === selectedId
            return (
              <button
                key={template.id}
                type='button'
                role='radio'
                aria-checked={isSelected}
                disabled={updateTemplate.isPending}
                onClick={() => selectTemplate(template.id)}
                className={cn(
                  'group relative flex flex-col gap-3 rounded-[10px] border bg-background/70 p-4 text-left transition-colors',
                  isSelected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border/80 hover:border-primary/60',
                  updateTemplate.isPending && 'cursor-not-allowed opacity-70'
                )}
              >
                {isSelected ? (
                  <span className='absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                    <Check aria-hidden='true' className='h-3 w-3' />
                  </span>
                ) : null}
                <div className='flex gap-1.5' aria-hidden='true'>
                  {template.swatches.map((swatch, index) => (
                    <span
                      key={`${template.id}-swatch-${index}`}
                      className='h-7 w-7 rounded-full border border-black/5'
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
                <div className='space-y-1'>
                  <p className='font-serif text-foreground text-lg'>{template.name}</p>
                  <p className='font-sans text-muted-foreground text-sm leading-6'>
                    {template.description}
                  </p>
                </div>
                <span className='font-mono text-[0.58rem] text-foreground/45 uppercase tracking-[0.18em]'>
                  {isSelected ? 'Selected' : 'Select'}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
