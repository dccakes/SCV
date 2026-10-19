/**
 * Thrown by the repository when a concurrent request seated the same guest
 * for the event first (the unique guest-per-event constraint fired).
 */
export class SeatAlreadyTakenError extends Error {
  constructor() {
    super('Guest was seated by another request at the same time')
    this.name = 'SeatAlreadyTakenError'
  }
}

/**
 * Thrown by the repository when the table no longer exists by the time its
 * row lock is taken (another planner deleted it).
 */
export class SeatingTableNotFoundError extends Error {
  constructor() {
    super('Seating table no longer exists')
    this.name = 'SeatingTableNotFoundError'
  }
}
