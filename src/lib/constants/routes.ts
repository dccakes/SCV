/**
 * Route Constants
 *
 * Centralized route definitions for the application.
 */

export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
  },

  // Main app routes
  DASHBOARD: '/dashboard',
  GUEST_LIST: '/guest-list',
  EVENTS: '/events',
  WEBSITE: '/website',
  SETTINGS: '/settings',

  // Public wedding website routes
  WEDDING: {
    HOME: (subUrl: string) => `/${subUrl}`,
    RSVP: (subUrl: string) => `/${subUrl}/rsvp`,
  },
} as const
