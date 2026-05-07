'use client'

import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  toSnakeCase,
  type VendorCategoryConfig,
  type VendorCustomFieldDefinition,
  type VendorCustomFieldType,
} from '~/components/vendor/vendor-enrichment-types'
import type { VendorCategory } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type CategoryConfigApi = typeof api.vendor & {
  getCategoryConfig: {
    useQuery: (
      input: { category: VendorCategory },
      options?: { enabled?: boolean }
    ) => { data?: VendorCategoryConfig | null }
  }
  upsertCategoryConfig: {
    useMutation: (options?: { onSuccess?: () => void | Promise<void>; onError?: () => void }) => {
      mutate: (
        input: { category: VendorCategory; fieldDefinitions: VendorCustomFieldDefinition[] },
        options?: unknown
      ) => void
      isPending: boolean
    }
  }
}

type EditableFieldDefinition = VendorCustomFieldDefinition & {
  clientId: string
  isNew?: boolean
}

type VendorCategoryConfigEditorProps = {
  category: VendorCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}

function emptyFieldDefinition(displayOrder: number): EditableFieldDefinition {
  return {
    clientId: `new-${crypto.randomUUID()}`,
    key: '',
    label: '',
    type: 'text',
    displayOrder,
    isNew: true,
  }
}

export function VendorCategoryConfigEditor({
  category,
  open,
  onOpenChange,
}: VendorCategoryConfigEditorProps) {
  const vendorApi = api.vendor as CategoryConfigApi
  const { data } = vendorApi.getCategoryConfig.useQuery(
    { category },
    {
      enabled: open,
    }
  )
  const [fieldDefinitions, setFieldDefinitions] = useState<EditableFieldDefinition[]>([])
  const [didHydrate, setDidHydrate] = useState(false)

  useEffect(() => {
    if (!open) {
      setDidHydrate(false)
      return
    }

    if (didHydrate) return

    setFieldDefinitions(
      (data?.fieldDefinitions ?? []).map((definition) => ({
        ...definition,
        clientId: definition.key,
        isNew: false,
      }))
    )
    setDidHydrate(true)
  }, [data, didHydrate, open])

  const upsertCategoryConfig = vendorApi.upsertCategoryConfig.useMutation({
    onSuccess: () => {
      toast.success('Category fields saved')
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to save category fields'),
  })

  const addField = () => {
    setFieldDefinitions((current) => [...current, emptyFieldDefinition(current.length)])
  }

  const removeField = (index: number) => {
    setFieldDefinitions((current) =>
      current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((definition, displayOrder) => ({
          ...definition,
          displayOrder,
        }))
    )
  }

  const updateField = (
    index: number,
    patch: Partial<EditableFieldDefinition> & { type?: VendorCustomFieldType }
  ) => {
    setFieldDefinitions((current) =>
      current.map((definition, currentIndex) =>
        currentIndex === index ? { ...definition, ...patch } : definition
      )
    )
  }

  const handleSave = () => {
    const nextDefinitions = fieldDefinitions
      .map((definition, displayOrder) => {
        const label = definition.label.trim()
        const key = definition.key || toSnakeCase(label)

        if (!label || !key) return null

        return {
          key,
          label,
          type: definition.type,
          displayOrder,
        }
      })
      .filter((definition): definition is VendorCustomFieldDefinition => definition !== null)

    upsertCategoryConfig.mutate(
      {
        category,
        fieldDefinitions: nextDefinitions,
      },
      {}
    )
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-sidebar-ink/20 p-4'>
      <div
        role='dialog'
        aria-modal='true'
        aria-label='Customize Category'
        className='w-full max-w-2xl rounded-lg border border-border/80 bg-background p-6 shadow-xl'
      >
        <div className='mb-4 flex items-center justify-between gap-3'>
          <h2 className='font-display text-xl italic'>Customize Category</h2>
          <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className='space-y-4'>
          <div className='space-y-3'>
            {fieldDefinitions.length === 0 ? (
              <p className='font-mono text-[0.68rem] text-muted-foreground uppercase tracking-wider'>
                No fields yet
              </p>
            ) : null}

            {fieldDefinitions.map((definition, index) => {
              const labelId =
                definition.isNew && !definition.key
                  ? `field-label-${definition.clientId}`
                  : `label-${definition.clientId}`

              return (
                <div
                  key={definition.clientId}
                  className='grid gap-3 rounded-lg border border-border/80 bg-card/50 p-3 md:grid-cols-[minmax(0,1fr)_140px_auto]'
                >
                  <div className='space-y-1.5'>
                    <Label
                      htmlFor={labelId}
                      className='font-mono text-[0.58rem] uppercase tracking-wider'
                    >
                      {definition.isNew ? 'Field Label' : 'Label'}
                    </Label>
                    <Input
                      id={labelId}
                      aria-label={definition.isNew ? 'Field label' : `${definition.label} label`}
                      value={definition.label}
                      onChange={(event) =>
                        updateField(index, {
                          label: event.target.value,
                          key:
                            definition.isNew && !definition.key
                              ? ''
                              : definition.key || toSnakeCase(event.target.value),
                        })
                      }
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='font-mono text-[0.58rem] uppercase tracking-wider'>
                      Type
                    </Label>
                    <select
                      aria-label={`${definition.label || 'New field'} type`}
                      className='flex h-10 w-full rounded-[4px] border border-input bg-background px-3 font-mono text-[0.62rem] uppercase tracking-wider'
                      value={definition.type}
                      onChange={(event) =>
                        updateField(index, {
                          type: event.target.value as VendorCustomFieldType,
                        })
                      }
                    >
                      <option value='text'>Text</option>
                      <option value='number'>Number</option>
                      <option value='boolean'>Boolean</option>
                    </select>
                  </div>

                  <div className='flex items-end'>
                    <Button
                      type='button'
                      variant='ghost'
                      className='w-full justify-center'
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className='flex gap-3'>
            <Button type='button' variant='outline' onClick={addField}>
              Add Field
            </Button>
            <Button type='button' onClick={handleSave} disabled={upsertCategoryConfig.isPending}>
              {upsertCategoryConfig.isPending ? 'Saving...' : 'Save Fields'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
