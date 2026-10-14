'use client'

import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { Download, Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  createSeatingAnnouncements,
  SEATING_SCREEN_READER_INSTRUCTIONS,
} from '~/components/seating-chart/seating-announcements'
import { createChartCache } from '~/components/seating-chart/seating-chart-cache'
import type { DragData, DropData, GuestDragData } from '~/components/seating-chart/seating-dnd'
import { pickFocusAfterDrawerClose } from '~/components/seating-chart/seating-drawer-focus'
import { type FocusCandidate, getNextFocusKey } from '~/components/seating-chart/seating-focus'
import { SeatingGuestDrawer } from '~/components/seating-chart/seating-guest-drawer'
import { SeatingGuestSidebar } from '~/components/seating-chart/seating-guest-sidebar'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  fitOnCanvas,
  getNextTablePosition,
  refitAfterResize,
} from '~/components/seating-chart/seating-layout'
import {
  SeatingTableDialog,
  type SeatingTableFormValues,
} from '~/components/seating-chart/seating-table-dialog'
import { SeatingTableNode } from '~/components/seating-chart/seating-table-node'
import {
  ADD_TABLE_FOCUS_KEY,
  resolveTableSubmit,
  type TableDialogState,
  tableDialogFocusKey,
} from '~/components/seating-chart/seating-table-submit'
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
import {
  getOpenSeats,
  openSeatsMessage,
  tableHasRoom,
} from '~/server/domains/seating/seating.rules'
import type { SeatingChart, SeatingGuest } from '~/server/domains/seating/seating.types'
import { api } from '~/trpc/react'

type SeatingChartBuilderProps = {
  events: Array<{ id: string; name: string }>
  initialEventId: string | null
}

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

// Sidebar items in DOM order, read when a keyboard drop is about to remove one
const readSidebarFocusCandidates = (): FocusCandidate[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-seating-sidebar] [data-seating-focus-key]')
  ).map((node) => ({
    key: node.dataset.seatingFocusKey ?? '',
    guestIds: (node.dataset.seatingGuestIds ?? '').split(',').filter(Boolean).map(Number),
  }))

const findFocusTarget = (key: string) =>
  document.querySelector<HTMLElement>(`[data-seating-focus-key="${key}"]`)

// Focus the first key that is on the page; false when none is
const focusFirstPresent = (keys: ReadonlyArray<string | null>): boolean => {
  for (const key of keys) {
    const target = key ? findFocusTarget(key) : null
    if (target) {
      target.focus()
      return true
    }
  }
  return false
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
  // What opened the guest drawer, so focus can land somewhere sensible on close
  const drawerOpener = useRef<{ key: string; sidebarKeys: string[]; guestId: number } | null>(null)
  const [tableDialog, setTableDialog] = useState<TableDialogState>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  // Where focus returns when the table or delete dialog closes
  const tableDialogReturnKey = useRef(ADD_TABLE_FOCUS_KEY)
  const [activeDrag, setActiveDrag] = useState<GuestDragData | null>(null)
  // Focus to apply after a keyboard drop, once the chart the drop happened on
  // has been replaced by the optimistic update (the target may not exist yet,
  // or may be about to remount under another table)
  const [pendingFocus, setPendingFocus] = useState<{
    key: string
    chartAtDrop: SeatingChart | undefined
  } | null>(null)
  const focusAfterDrop = (key: string | null) => {
    if (key) setPendingFocus({ key, chartAtDrop: chart })
  }

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
  const tablesById = useMemo(
    () => new Map((chart?.tables ?? []).map((table) => [table.id, table])),
    [chart]
  )
  const selectedGuest = selectedGuestId === null ? null : (guestsById.get(selectedGuestId) ?? null)
  const selectedHousehold =
    chart?.households.find((household) => household.id === selectedGuest?.householdId) ?? null
  const seatedCount = allGuests.filter((guest) => guest.tableId !== null).length

  // Optimistic updates are keyed to the event each mutation started in
  const cache = createChartCache(utils.seating.getChart)
  type MutationContext = Awaited<ReturnType<typeof cache.optimistic>> | undefined
  // Shared by every optimistic mutation: undo and explain on error, refetch after
  const optimisticHandlers = {
    onError: (error: { message: string }, _input: unknown, context: MutationContext) => {
      cache.rollback(context)
      toast.error(error.message)
    },
    onSettled: (_data: unknown, _error: unknown, _input: unknown, context: MutationContext) =>
      cache.refresh(context),
  }

  const assignGuests = api.seating.assignGuests.useMutation({
    onMutate: ({ tableId, guestIds }) =>
      cache.optimistic(chartInput, (current) => seatGuests(current, tableId, guestIds)),
    ...optimisticHandlers,
  })
  const unassignGuests = api.seating.unassignGuests.useMutation({
    onMutate: ({ eventId: mutationEventId, guestIds }) =>
      cache.optimistic({ eventId: mutationEventId }, (current) =>
        seatGuests(current, null, guestIds)
      ),
    ...optimisticHandlers,
  })
  const updateTable = api.seating.updateTable.useMutation({
    onMutate: ({ id, data }) =>
      cache.optimistic(chartInput, (current) => ({
        ...current,
        tables: current.tables.map((table) => (table.id === id ? { ...table, ...data } : table)),
      })),
    ...optimisticHandlers,
    onSuccess: () => setTableDialog(null),
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
    ...optimisticHandlers,
  })

  // Waits for the chart to change, then focuses on the next frame so dnd-kit's
  // own focus restore (which finds no node) goes first
  useEffect(() => {
    if (!pendingFocus || !chart || chart === pendingFocus.chartAtDrop) return
    const frame = requestAnimationFrame(() => {
      findFocusTarget(pendingFocus.key)?.focus()
      setPendingFocus(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingFocus, chart])

  const openGuestFrom = (source: 'sidebar' | 'seat') => (guestId: number) => {
    // A guest who dropped off the chart leaves the drawer closed: a fresh open
    if (selectedGuest === null) {
      drawerOpener.current = {
        key: `${source === 'sidebar' ? 'sidebar-guest' : 'seat-guest'}:${guestId}`,
        sidebarKeys: readSidebarFocusCandidates().map((candidate) => candidate.key),
        guestId,
      }
    }
    setSelectedGuestId(guestId)
  }

  // Switching guests inside the open drawer: focus follows the guest shown last
  const switchDrawerGuest = (guestId: number) => {
    if (drawerOpener.current) drawerOpener.current.guestId = guestId
    setSelectedGuestId(guestId)
  }

  // Seating or unseating from the drawer removes the element that opened it;
  // send focus to the next guest (or the guest's new spot) instead of <body>
  const handleDrawerCloseAutoFocus = (event: Event) => {
    // Runs however the drawer closed, including its guest dropping off the
    // chart, so the selection never lingers and the drawer cannot reopen itself
    setSelectedGuestId(null)
    const opener = drawerOpener.current
    drawerOpener.current = null
    if (!opener) return
    const target = pickFocusAfterDrawerClose({
      openerKey: opener.key,
      sidebarKeysAtOpen: opener.sidebarKeys,
      guestId: opener.guestId,
      isPresent: (key) => findFocusTarget(key) !== null,
    })
    event.preventDefault()
    // Last resort: the sidebar search box
    if (!focusFirstPresent([target])) {
      document.querySelector<HTMLElement>('[data-seating-sidebar] input')?.focus()
    }
  }

  const openTableDialog = (dialog: NonNullable<TableDialogState>) => {
    tableDialogReturnKey.current = tableDialogFocusKey(dialog)
    setTableDialog(dialog)
  }

  // Both table dialogs open from state, not a Radix trigger, so return focus
  // ourselves; a deleted table falls back to the Add table button
  const returnFocusFromTableDialog = (event: Event) => {
    event.preventDefault()
    focusFirstPresent([tableDialogReturnKey.current, ADD_TABLE_FOCUS_KEY])
  }

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
      const table = tablesById.get(data.tableId)
      if (!table || (event.delta.x === 0 && event.delta.y === 0)) return
      const position = fitOnCanvas(
        { positionX: table.positionX + event.delta.x, positionY: table.positionY + event.delta.y },
        table.shape,
        table.capacity
      )
      updateTable.mutate({ id: table.id, data: position })
      return
    }

    const drop = event.over?.data.current as DropData | undefined
    if (!drop) return

    const isKeyboard = event.activatorEvent instanceof KeyboardEvent
    if (drop.type === 'unassigned') {
      const seated = data.guestIds.filter((id) => guestsById.get(id)?.tableId != null)
      if (seated.length === 0) return
      // Keyboard users follow the guest back to the sidebar
      if (isKeyboard) focusAfterDrop(`sidebar-guest:${seated[0]}`)
      unassignGuests.mutate({ eventId, guestIds: seated })
      return
    }

    const table = tablesById.get(drop.tableId)
    if (!table) return
    if (data.guestIds.every((id) => table.guestIds.includes(id))) return
    if (!tableHasRoom(table, data.guestIds)) {
      toast.error(openSeatsMessage(table.name, getOpenSeats(table)))
      return
    }
    // Keyboard users keep their place: from the sidebar, focus the next
    // unseated guest; a seated guest moved to another table keeps focus
    if (isKeyboard) {
      const [firstGuestId] = data.guestIds
      const fromSeat = firstGuestId !== undefined && guestsById.get(firstGuestId)?.tableId != null
      focusAfterDrop(
        fromSeat
          ? `seat-guest:${firstGuestId}`
          : getNextFocusKey(readSidebarFocusCandidates(), String(event.active.id), data.guestIds)
      )
    }
    assignGuests.mutate({ tableId: table.id, guestIds: data.guestIds })
  }

  const editingTable =
    tableDialog?.mode === 'edit' ? tablesById.get(tableDialog.tableId) : undefined
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
    if (!eventId || !chart || !tableDialog) return
    const action = resolveTableSubmit(tableDialog, chart.tables)
    if (action.kind === 'missing') {
      toast.error('This table was deleted. Refresh to see the latest seating chart.')
      setTableDialog(null)
      return
    }
    if (action.kind === 'update') {
      const table = tablesById.get(action.tableId)
      const position = table && refitAfterResize(table, values.shape, values.capacity)
      updateTable.mutate({ id: action.tableId, data: { ...values, ...position } })
      return
    }
    const position = getNextTablePosition(chart.tables)
    createTable.mutate({ eventId, ...values, positionX: position.x, positionY: position.y })
  }

  // Seat one guest from the drawer, the non-drag path to the same mutation
  const handleSeatGuest = (guestId: number, tableId: string) => {
    const table = tablesById.get(tableId)
    if (!table) return
    if (!tableHasRoom(table, [guestId])) {
      toast.error(`${table.name} is full`)
      return
    }
    assignGuests.mutate({ tableId, guestIds: [guestId] })
  }

  const announcements = useMemo(
    () => createSeatingAnnouncements((tableId) => tablesById.get(tableId)),
    [tablesById]
  )

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
          <Button
            data-seating-focus-key={ADD_TABLE_FOCUS_KEY}
            onClick={() => openTableDialog({ mode: 'create' })}
            disabled={!chart}
          >
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
          accessibility={{
            announcements,
            screenReaderInstructions: SEATING_SCREEN_READER_INSTRUCTIONS,
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div className='grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[18rem_1fr]'>
            <SeatingGuestSidebar
              households={chart.households}
              totalGuests={allGuests.length}
              seatedGuests={seatedCount}
              onSelectGuest={openGuestFrom('sidebar')}
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
                    onEdit={(tableId) => openTableDialog({ mode: 'edit', tableId })}
                    onSelectGuest={openGuestFrom('seat')}
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
        onCloseAutoFocus={returnFocusFromTableDialog}
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
        <AlertDialogContent onCloseAutoFocus={returnFocusFromTableDialog}>
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
        onSelectGuest={switchDrawerGuest}
        onCloseAutoFocus={handleDrawerCloseAutoFocus}
        onUnseat={(guestId) => {
          if (eventId) unassignGuests.mutate({ eventId, guestIds: [guestId] })
        }}
        onSeat={handleSeatGuest}
      />
    </div>
  )
}
