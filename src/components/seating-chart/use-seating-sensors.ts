import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

// Space picks up and drops; Enter is left to the element's click so keyboard
// users can still open the table editor or guest details.
// Options are module constants so useSensor's memo holds across renders;
// new objects each render would re-create every draggable's listeners.
const KEYBOARD_OPTIONS = {
  keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
}
const MOUSE_OPTIONS = { activationConstraint: { distance: 6 } }
const TOUCH_OPTIONS = { activationConstraint: { delay: 180, tolerance: 8 } }

/**
 * Mouse drags start after a small move so clicks still work; touch drags need
 * a long press so the floor plan and guest list can still be scrolled.
 */
export const useSeatingSensors = () =>
  useSensors(
    useSensor(MouseSensor, MOUSE_OPTIONS),
    useSensor(TouchSensor, TOUCH_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_OPTIONS)
  )
