import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

// Space picks up and drops; Enter is left to the element's click so keyboard
// users can still open the table editor or guest details.
const KEYBOARD_CODES = {
  start: ['Space'],
  cancel: ['Escape'],
  end: ['Space', 'Enter'],
}

/**
 * Mouse drags start after a small move so clicks still work; touch drags need
 * a long press so the floor plan and guest list can still be scrolled.
 */
export const useSeatingSensors = () =>
  useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { keyboardCodes: KEYBOARD_CODES })
  )
