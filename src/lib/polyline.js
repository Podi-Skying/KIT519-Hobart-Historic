/**
 * Decode a Google "encoded polyline" string into coordinates.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * @param {string} encoded
 * @returns {{lat:number, lng:number}[]}
 */
export function decodePolyline(encoded) {
  const points = []
  let index = 0
  let lat = 0
  let lng = 0

  const nextValue = () => {
    let result = 0
    let shift = 0
    let byte
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    return result & 1 ? ~(result >> 1) : result >> 1
  }

  while (index < encoded.length) {
    lat += nextValue()
    lng += nextValue()
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}
