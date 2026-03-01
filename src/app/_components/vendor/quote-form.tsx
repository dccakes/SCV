'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { api } from '~/trpc/react'

type QuoteFormProps = {
  vendorId: string
  onSuccess: () => void
  onCancel: () => void
}

export function QuoteForm({ vendorId, onSuccess, onCancel }: QuoteFormProps) {
  const [price, setPrice] = useState('')
  const [quoteDate, setQuoteDate] = useState('')
  const [notes, setNotes] = useState('')

  const addQuote = api.vendor.addQuote.useMutation({
    onSuccess: () => {
      toast.success('Quote added')
      onSuccess()
    },
    onError: () => toast.error('Failed to add quote'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!price || !quoteDate) return
    addQuote.mutate({
      vendorId,
      price: parseFloat(price),
      quoteDate,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border p-4">
      <h4 className="text-sm font-semibold text-gray-700">New Quote</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price" className="text-xs">
            Price ($)
          </Label>
          <Input
            id="price"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="quoteDate" className="text-xs">
            Date
          </Label>
          <Input
            id="quoteDate"
            type="date"
            value={quoteDate}
            onChange={(e) => setQuoteDate(e.target.value)}
            required
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes" className="text-xs">
          Notes
        </Label>
        <Textarea
          id="notes"
          placeholder="Package details, inclusions, conditions…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
      <div className="flex gap-2 self-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={addQuote.isPending} className="bg-pink-400 hover:bg-pink-500">
          {addQuote.isPending ? 'Saving…' : 'Add Quote'}
        </Button>
      </div>
    </form>
  )
}
