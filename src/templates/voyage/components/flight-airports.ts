/**
 * A curated list of major international airports for the "Flying From"
 * lookup, scoped to the regions guests are most likely to travel from
 * (UK, US, Mexico, Australia, UAE) plus a few other well-known hubs.
 *
 * This isn't an exhaustive airport database — it's a convenience list for
 * autocomplete. Guests flying from an airport not listed here can still type
 * any IATA code directly.
 */
export type OriginAirport = {
  code: string
  city: string
  country: string
}

export const ORIGIN_AIRPORTS: OriginAirport[] = [
  // United Kingdom
  { code: 'LHR', city: 'London', country: 'United Kingdom' },
  { code: 'LGW', city: 'London', country: 'United Kingdom' },
  { code: 'STN', city: 'London', country: 'United Kingdom' },
  { code: 'LTN', city: 'London', country: 'United Kingdom' },
  { code: 'MAN', city: 'Manchester', country: 'United Kingdom' },
  { code: 'BHX', city: 'Birmingham', country: 'United Kingdom' },
  { code: 'EDI', city: 'Edinburgh', country: 'United Kingdom' },
  { code: 'GLA', city: 'Glasgow', country: 'United Kingdom' },
  { code: 'BRS', city: 'Bristol', country: 'United Kingdom' },

  // United States
  { code: 'ATL', city: 'Atlanta', country: 'United States' },
  { code: 'JFK', city: 'New York', country: 'United States' },
  { code: 'EWR', city: 'Newark', country: 'United States' },
  { code: 'ORD', city: 'Chicago', country: 'United States' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States' },
  { code: 'SFO', city: 'San Francisco', country: 'United States' },
  { code: 'SEA', city: 'Seattle', country: 'United States' },
  { code: 'RDU', city: 'Raleigh-Durham', country: 'United States' },
  { code: 'IAD', city: 'Washington, D.C.', country: 'United States' },
  { code: 'BOS', city: 'Boston', country: 'United States' },
  { code: 'MIA', city: 'Miami', country: 'United States' },
  { code: 'DFW', city: 'Dallas-Fort Worth', country: 'United States' },
  { code: 'IAH', city: 'Houston', country: 'United States' },

  // Mexico
  { code: 'MEX', city: 'Mexico City', country: 'Mexico' },
  { code: 'CUN', city: 'Cancún', country: 'Mexico' },
  { code: 'GDL', city: 'Guadalajara', country: 'Mexico' },
  { code: 'MTY', city: 'Monterrey', country: 'Mexico' },

  // Australia
  { code: 'SYD', city: 'Sydney', country: 'Australia' },
  { code: 'BNE', city: 'Brisbane', country: 'Australia' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia' },
  { code: 'PER', city: 'Perth', country: 'Australia' },

  // United Arab Emirates
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'United Arab Emirates' },

  // Other well-known hubs
  { code: 'MAD', city: 'Madrid', country: 'Spain' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
]

/** Case-insensitive match on IATA code prefix, city, or country. */
export function searchOriginAirports(query: string, limit = 6): OriginAirport[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  return ORIGIN_AIRPORTS.filter(
    (airport) =>
      airport.code.toLowerCase().startsWith(trimmed) ||
      airport.city.toLowerCase().includes(trimmed) ||
      airport.country.toLowerCase().includes(trimmed)
  ).slice(0, limit)
}
