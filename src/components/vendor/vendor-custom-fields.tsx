'use client'

import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type {
  VendorCustomFieldDefinition,
  VendorCustomFieldValues,
} from '~/components/vendor/vendor-enrichment-types'

type VendorCustomFieldsProps = {
  definitions: VendorCustomFieldDefinition[]
  values: VendorCustomFieldValues | null | undefined
  onSave: (values: VendorCustomFieldValues) => void
  isSaving: boolean
}

function normalizeValues(
  definitions: VendorCustomFieldDefinition[],
  values: VendorCustomFieldValues | null | undefined
) {
  const next: VendorCustomFieldValues = {}

  for (const definition of definitions) {
    if (values?.[definition.key] != null) {
      next[definition.key] = values[definition.key] ?? ''
      continue
    }

    if (definition.type === 'boolean') {
      next[definition.key] = 'false'
    }
  }

  return next
}

export function VendorCustomFields({
  definitions,
  values,
  onSave,
  isSaving,
}: VendorCustomFieldsProps) {
  const [draftValues, setDraftValues] = useState<VendorCustomFieldValues>(() =>
    normalizeValues(definitions, values)
  )

  useEffect(() => {
    setDraftValues(normalizeValues(definitions, values))
  }, [definitions, values])

  if (definitions.length === 0) {
    return (
      <p className='font-mono text-[0.68rem] text-muted-foreground uppercase tracking-wider'>
        No category fields configured yet
      </p>
    )
  }

  const sortedDefinitions = [...definitions].sort((a, b) => a.displayOrder - b.displayOrder)

  const handleSave = () => {
    const nextValues: VendorCustomFieldValues = {}

    for (const definition of sortedDefinitions) {
      const value = draftValues[definition.key]

      if (definition.type === 'boolean') {
        nextValues[definition.key] = value === 'true' ? 'true' : 'false'
        continue
      }

      const normalized = value?.trim() ?? ''
      if (normalized) {
        nextValues[definition.key] = normalized
      }
    }

    onSave(nextValues)
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-3'>
        {sortedDefinitions.map((definition) => {
          if (definition.type === 'boolean') {
            const inputId = `custom-field-${definition.key}`

            return (
              <div
                key={definition.key}
                className='flex items-center justify-between rounded-lg border border-border/80 bg-card/50 px-3 py-2.5'
              >
                <Label htmlFor={inputId} className='font-sans text-foreground text-sm'>
                  {definition.label}
                </Label>
                <Checkbox
                  id={inputId}
                  aria-label={definition.label}
                  checked={draftValues[definition.key] === 'true'}
                  onCheckedChange={(checked) =>
                    setDraftValues((current) => ({
                      ...current,
                      [definition.key]: checked ? 'true' : 'false',
                    }))
                  }
                />
              </div>
            )
          }

          return (
            <div key={definition.key} className='space-y-1.5'>
              <Label htmlFor={`custom-field-${definition.key}`} className='font-sans text-sm'>
                {definition.label}
              </Label>
              <Input
                id={`custom-field-${definition.key}`}
                type={definition.type === 'number' ? 'number' : 'text'}
                value={draftValues[definition.key] ?? ''}
                onChange={(event) =>
                  setDraftValues((current) => ({
                    ...current,
                    [definition.key]: event.target.value,
                  }))
                }
              />
            </div>
          )
        })}
      </div>

      <Button type='button' variant='outline' onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Custom Fields'}
      </Button>
    </div>
  )
}
