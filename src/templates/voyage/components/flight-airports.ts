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
  name: string
  city: string
  country: string
}

export const ORIGIN_AIRPORTS: OriginAirport[] = [
  // United Kingdom
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom' },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'United Kingdom' },
  { code: 'STN', name: 'Stansted', city: 'London', country: 'United Kingdom' },
  { code: 'LTN', name: 'Luton', city: 'London', country: 'United Kingdom' },
  { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom' },
  { code: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom' },
  { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom' },
  { code: 'GLA', name: 'Glasgow Airport', city: 'Glasgow', country: 'United Kingdom' },
  { code: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'United Kingdom' },

  // United States
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'United States' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'United States' },
  { code: 'EWR', name: 'Newark Liberty', city: 'Newark', country: 'United States' },
  { code: 'ORD', name: "O'Hare", city: 'Chicago', country: 'United States' },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'United States' },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'United States' },
  { code: 'SEA', name: 'Sea-Tac', city: 'Seattle', country: 'United States' },
  { code: 'RDU', name: 'Raleigh-Durham Intl', city: 'Raleigh-Durham', country: 'United States' },
  { code: 'IAD', name: 'Dulles', city: 'Washington, D.C.', country: 'United States' },
  { code: 'BOS', name: 'Logan', city: 'Boston', country: 'United States' },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'United States' },
  {
    code: 'DFW',
    name: 'Dallas-Fort Worth Intl',
    city: 'Dallas-Fort Worth',
    country: 'United States',
  },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States' },

  // Mexico
  { code: 'MEX', name: 'Benito Juárez Intl', city: 'Mexico City', country: 'Mexico' },
  { code: 'CUN', name: 'Cancún Intl', city: 'Cancún', country: 'Mexico' },
  { code: 'GDL', name: 'Guadalajara Intl', city: 'Guadalajara', country: 'Mexico' },
  { code: 'MTY', name: 'Monterrey Intl', city: 'Monterrey', country: 'Mexico' },

  // Australia
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia' },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia' },

  // United Arab Emirates
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'AUH', name: 'Abu Dhabi Intl', city: 'Abu Dhabi', country: 'United Arab Emirates' },

  // Other well-known hubs
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
]

/** Case-insensitive match on IATA code prefix, airport name, city, or country. */
export function searchOriginAirports(query: string, limit = 6): OriginAirport[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  return ORIGIN_AIRPORTS.filter(
    (airport) =>
      airport.code.toLowerCase().startsWith(trimmed) ||
      airport.name.toLowerCase().includes(trimmed) ||
      airport.city.toLowerCase().includes(trimmed) ||
      airport.country.toLowerCase().includes(trimmed)
  ).slice(0, limit)
}
