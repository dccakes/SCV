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
