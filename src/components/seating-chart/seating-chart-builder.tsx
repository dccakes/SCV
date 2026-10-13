'use client'

import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { Download, Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createChartCache } from '~/components/seating-chart/seating-chart-cache'
import type { DragData, DropData, GuestDragData } from '~/components/seating-chart/seating-dnd'
import { SeatingGuestDrawer } from '~/components/seating-chart/seating-guest-drawer'
import { SeatingGuestSidebar } from '~/components/seating-chart/seating-guest-sidebar'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clampTablePosition,
  getNextTablePosition,
  getTableFootprint,
} from '~/components/seating-chart/seating-layout'
import {
  SeatingTableDialog,
  type SeatingTableFormValues,
} from '~/components/seating-chart/seating-table-dialog'
import { SeatingTableNode } from '~/components/seating-chart/seating-table-node'
import { useSeatingSensors } from '~/components/seating-chart/use-seating-sensors'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { AsyncState } from '~/components/ui/async-state'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { buildSeatingCsv } from '~/lib/seating/seating-csv'
import { hasRoomForGuests } from '~/server/domains/seating/seating.rules'
import type { SeatingChart, SeatingGuest } from '~/server/domains/seating/seating.types'
import { api } from '~/trpc/react'

type SeatingChartBuilderProps = {
  events: Array<{ id: string; name: string }>
  initialEventId: string | null
}

type TableDialogState = { mode: 'create' } | { mode: 'edit'; tableId: string } | null

const DEFAULT_CAPACITY = 8

const seatGuests = (chart: SeatingChart, tableId: string | null, guestIds: number[]) => {
  const moving = new Set(guestIds)
  return {
    tables: chart.tables.map((table) => {
      const remaining = table.guestIds.filter((id) => !moving.has(id))
      return { ...table, guestIds: table.id === tableId ? [...remaining, ...guestIds] : remaining }
    }),
    households: chart.households.map((household) => ({
      ...household,
      guests: household.guests.map((guest) =>
        moving.has(guest.id) ? { ...guest, tableId } : guest
      ),
    })),
  }
}

const downloadCsv = (fileName: string, csv: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'event'

export function SeatingChartBuilder(props: Readonly<SeatingChartBuilderProps>) {
  const { events, initialEventId } = props
  const router = useRouter()
  const pathname = usePathname()
  const utils = api.useUtils()

  const [eventId, setEventId] = useState(initialEventId ?? events[0]?.id ?? null)
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [tableDialog, setTableDialog] = useState<TableDialogState>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<GuestDragData | null>(null)

  const chartInput = { eventId: eventId ?? '' }
  const chartQuery = api.seating.getChart.useQuery(chartInput, { enabled: eventId !== null })
  const chart = chartQuery.data

  const sensors = useSeatingSensors()

  const allGuests = useMemo(
    () => chart?.households.flatMap((household) => household.guests) ?? [],
    [chart]
  )
  const guestsById = useMemo(
    () => new Map<number, SeatingGuest>(allGuests.map((guest) => [guest.id, guest])),
    [allGuests]
  )
  const selectedGuest = selectedGuestId === null ? null : (guestsById.get(selectedGuestId) ?? null)
  const selectedHousehold =
    chart?.households.find((household) => household.id === selectedGuest?.householdId) ?? null
  const seatedCount = allGuests.filter((guest) => guest.tableId !== null).length

  // Optimistic updates are keyed to the event each mutation started in
  const cache = createChartCache(utils.seating.getChart)
  const onMutationError = (
    error: { message: string },
    context: Awaited<ReturnType<typeof cache.optimistic>> | undefined
  ) => {
    cache.rollback(context)
    toast.error(error.message)
  }

  const assignGuests = api.seating.assignGuests.useMutation({
    onMutate: ({ tableId, guestIds }) =>
      cache.optimistic(chartInput, (current) => seatGuests(current, tableId, guestIds)),
    onError: (error, _input, context) => onMutationError(error, context),
    onSettled: (_data, _error, _input, context) => cache.refresh(context),
  })
  const unassignGuests = api.seating.unassignGuests.useMutation({
    onMutate: ({ eventId: mutationEventId, guestIds }) =>
      cache.optimistic({ eventId: mutationEventId }, (current) =>
        seatGuests(current, null, guestIds)
      ),
    onError: (error, _input, context) => onMutationError(error, context),
    onSettled: (_data, _error, _input, context) => cache.refresh(context),
  })
  const updateTable = api.seating.updateTable.useMutation({
    onMutate: ({ id, data }) =>
      cache.optimistic(chartInput, (current) => ({
        ...current,
        tables: current.tables.map((table) => (table.id === id ? { ...table, ...data } : table)),
      })),
    onError: (error, _input, context) => onMutationError(error, context),
    onSuccess: () => setTableDialog(null),
    onSettled: (_data, _error, _input, context) => cache.refresh(context),
  })
  const createTable = api.seating.createTable.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: () => setTableDialog(null),
    onSettled: (_data, _error, input) =>
      utils.seating.getChart.invalidate({ eventId: input.eventId }),
  })
  const deleteTable = api.seating.deleteTable.useMutation({
    onMutate: ({ id }) =>
      cache.optimistic(chartInput, (current) => {
        const removed = current.tables.find((table) => table.id === id)
        const unseated = seatGuests(current, null, removed?.guestIds ?? [])
        return { ...unseated, tables: unseated.tables.filter((table) => table.id !== id) }
      }),
    onError: (error, _input, context) => onMutationError(error, context),
    onSettled: (_data, _error, _input, context) => cache.refresh(context),
  })

  const handleEventChange = (nextEventId: string) => {
    setEventId(nextEventId)
    setSelectedGuestId(null)
    router.replace(`${pathname}?eventId=${nextEventId}`, { scroll: false })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    setActiveDrag(data?.type === 'guests' ? data : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    if (!chart || !eventId) return
    const data = event.active.data.current as DragData | undefined
    if (!data) return

    if (data.type === 'table') {
      const table = chart.tables.find((candidate) => candidate.id === data.tableId)
      if (!table || (event.delta.x === 0 && event.delta.y === 0)) return
      const position = clampTablePosition(
        { x: table.positionX + event.delta.x, y: table.positionY + event.delta.y },
        getTableFootprint(table.shape, table.capacity)
      )
      updateTable.mutate({ id: table.id, data: { positionX: position.x, positionY: position.y } })
      return
    }

    const drop = event.over?.data.current as DropData | undefined
    if (!drop) return

    if (drop.type === 'unassigned') {
      const seated = data.guestIds.filter((id) => guestsById.get(id)?.tableId != null)
      if (seated.length > 0) unassignGuests.mutate({ eventId, guestIds: seated })
      return
    }

    const table = chart.tables.find((candidate) => candidate.id === drop.tableId)
    if (!table) return
    if (data.guestIds.every((id) => table.guestIds.includes(id))) return
    if (
      !hasRoomForGuests({ capacity: table.capacity, seatedGuestIds: table.guestIds }, data.guestIds)
    ) {
      const openSeats = table.capacity - table.guestIds.length
      toast.error(`${table.name} only has ${openSeats} open seat${openSeats === 1 ? '' : 's'}`)
      return
    }
    assignGuests.mutate({ tableId: table.id, guestIds: data.guestIds })
  }

  const editingTable =
    tableDialog?.mode === 'edit'
      ? chart?.tables.find((table) => table.id === tableDialog.tableId)
      : undefined
  const dialogDefaults = useMemo<SeatingTableFormValues>(
    () =>
      editingTable
        ? { name: editingTable.name, shape: editingTable.shape, capacity: editingTable.capacity }
        : {
            name: `Table ${(chart?.tables.length ?? 0) + 1}`,
            shape: 'ROUND',
            capacity: DEFAULT_CAPACITY,
          },
    [editingTable, chart?.tables.length]
  )

  const handleTableSubmit = (values: SeatingTableFormValues) => {
    if (!eventId || !chart) return
    if (editingTable) {
      updateTable.mutate({ id: editingTable.id, data: values })
      return
    }
    const position = getNextTablePosition(chart.tables)
    createTable.mutate({ eventId, ...values, positionX: position.x, positionY: position.y })
  }

  const handleExport = () => {
    if (!chart) return
    const eventName = events.find((event) => event.id === eventId)?.name ?? 'event'
    downloadCsv(`seating-${slugify(eventName)}.csv`, buildSeatingCsv(chart.tables, allGuests))
  }

  if (events.length === 0) {
    return <AsyncState isEmpty emptyText='Create an event first, then come back to seat guests.' />
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Select value={eventId ?? undefined} onValueChange={handleEventChange}>
          <SelectTrigger className='sm:w-64' aria-label='Event'>
            <SelectValue placeholder='Select event' />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleExport} disabled={!chart}>
            <Download className='mr-2 h-4 w-4' aria-hidden='true' />
            Export CSV
          </Button>
          <Button onClick={() => setTableDialog({ mode: 'create' })} disabled={!chart}>
            <Plus className='mr-2 h-4 w-4' aria-hidden='true' />
            Add table
          </Button>
        </div>
      </div>

      {chartQuery.isLoading || !chart ? (
        <AsyncState
          isLoading={chartQuery.isLoading}
          error={chartQuery.error?.message ?? null}
          loadingText='Loading seating chart...'
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div className='grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[18rem_1fr]'>
            <SeatingGuestSidebar
              households={chart.households}
              totalGuests={allGuests.length}
              seatedGuests={seatedCount}
              onSelectGuest={setSelectedGuestId}
            />
            <section
              aria-label='Floor plan'
              className='relative h-[65vh] min-h-[24rem] overflow-auto rounded-md border border-border/70 bg-muted/30 lg:h-auto'
            >
              <div
                className='relative'
                style={{
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  backgroundImage:
                    'radial-gradient(circle, hsl(var(--foreground) / 0.12) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                {chart.tables.length === 0 ? (
                  <p className='absolute top-10 left-10 max-w-xs text-muted-foreground text-sm'>
                    Add a table to start your floor plan. Drag tables to arrange the room, then drag
                    guests or whole households onto them.
                  </p>
                ) : null}
                {chart.tables.map((table) => (
                  <SeatingTableNode
                    key={table.id}
                    table={table}
                    guestsById={guestsById}
                    onEdit={(tableId) => setTableDialog({ mode: 'edit', tableId })}
                    onSelectGuest={setSelectedGuestId}
                  />
                ))}
              </div>
            </section>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDrag ? (
              <div className='pointer-events-none rounded-full border border-foreground/30 bg-card px-3 py-1.5 text-sm shadow-lg'>
                {activeDrag.label}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <SeatingTableDialog
        mode={tableDialog?.mode ?? 'create'}
        open={tableDialog !== null}
        defaultValues={dialogDefaults}
        minCapacity={editingTable?.guestIds.length ?? 0}
        isSubmitting={createTable.isPending || updateTable.isPending}
        onOpenChange={(open) => {
          if (!open) setTableDialog(null)
        }}
        onSubmit={handleTableSubmit}
        onDelete={
          editingTable
            ? () => {
                setPendingDeleteId(editingTable.id)
                setTableDialog(null)
              }
            : undefined
        }
      />

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this table?</AlertDialogTitle>
            <AlertDialogDescription>
              Guests seated here will move back to the unseated list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) deleteTable.mutate({ id: pendingDeleteId })
                setPendingDeleteId(null)
              }}
            >
              Delete table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SeatingGuestDrawer
        guest={selectedGuest}
        household={selectedHousehold}
        tables={chart?.tables ?? []}
        onClose={() => setSelectedGuestId(null)}
        onSelectGuest={setSelectedGuestId}
        onUnseat={(guestId) => {
          if (eventId) unassignGuests.mutate({ eventId, guestIds: [guestId] })
        }}
      />
    </div>
  )
}
