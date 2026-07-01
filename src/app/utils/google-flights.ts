/**
 * Builds a deep link into Google Flights' results page.
 *
 * Google Flights has no public/stable search API — its results URL carries a
 * base64url-encoded protobuf (`tfs`) that the site's own "share" button
 * produces. The wire format below was reverse-engineered from a real shared
 * link and cross-checked against the field numbers used by the open-source
 * scraper https://github.com/AWeirdDev/flights, which relies on the same
 * encoding to fetch live results.
 */

function encodeVarint(value: number): number[] {
  const bytes: number[] = []
  let remaining = value
  for (;;) {
    const byte = remaining & 0x7f
    remaining >>>= 7
    if (remaining) {
      bytes.push(byte | 0x80)
    } else {
      bytes.push(byte)
      return bytes
    }
  }
}

function tag(fieldNumber: number, wireType: number): number[] {
  return encodeVarint((fieldNumber << 3) | wireType)
}

function lengthDelimitedField(fieldNumber: number, bytes: number[]): number[] {
  return [...tag(fieldNumber, 2), ...encodeVarint(bytes.length), ...bytes]
}

function stringField(fieldNumber: number, value: string): number[] {
  return lengthDelimitedField(fieldNumber, Array.from(new TextEncoder().encode(value)))
}

function varintField(fieldNumber: number, value: number): number[] {
  return [...tag(fieldNumber, 0), ...encodeVarint(value)]
}

function airport(code: string): number[] {
  return stringField(2, code)
}

function flightLeg(date: string, fromCode: string, toCode: string): number[] {
  return [
    ...stringField(2, date),
    ...lengthDelimitedField(13, airport(fromCode)),
    ...lengthDelimitedField(14, airport(toCode)),
  ]
}

function base64UrlEncode(bytes: number[]): string {
  const binary = bytes.map((byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function buildGoogleFlightsUrl(params: {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
}): string {
  const origin = params.origin.trim().toUpperCase()
  const destination = params.destination.trim().toUpperCase()

  const bytes: number[] = [
    ...lengthDelimitedField(3, flightLeg(params.departDate, origin, destination)),
  ]
  if (params.returnDate) {
    bytes.push(...lengthDelimitedField(3, flightLeg(params.returnDate, destination, origin)))
  }
  bytes.push(...varintField(8, 1)) // 1 adult passenger
  bytes.push(...varintField(9, 1)) // economy cabin
  bytes.push(...varintField(19, params.returnDate ? 1 : 2)) // trip type: round trip vs one-way

  return `https://www.google.com/travel/flights/search?tfs=${base64UrlEncode(bytes)}`
}
