import { type GuestTag } from '@prisma/client'

export type { GuestTag }

export type CreateGuestTagInput = {
  weddingId: string
  name: string
  color?: string | null
}

export type UpdateGuestTagInput = {
  name?: string
  color?: string | null
}

export type GuestTagWithGuestCount = GuestTag & {
  _count: {
    guestTagAssignments: number
  }
}
