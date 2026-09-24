/**
 * Static walking-conditions snapshot for the prototype.
 * Replace with a weather API response of the same shape when going live.
 */
export const WEATHER = {
  location: 'Hobart',
  bestWindow: '12–2 pm',
  /** Comfort score 0–100 per hour; ≥ 80 is highlighted as "best". */
  hourlyComfort: [
    { hour: '9', score: 40 },
    { hour: '10', score: 55 },
    { hour: '11', score: 70 },
    { hour: '12', score: 85 },
    { hour: '1', score: 90 },
    { hour: '2', score: 80 },
    { hour: '3', score: 60 },
    { hour: '4', score: 45 },
    { hour: '5', score: 30 },
  ],
  /** `condition` picks the emoji (CONDITIONS) and the spoken text (weather.conditions.*). */
  forecast: [
    { day: 'Now', condition: 'partlyCloudy', high: 14 },
    { day: 'Mon', condition: 'sunny', high: 16 },
    { day: 'Tue', condition: 'rain', high: 11 },
    { day: 'Wed', condition: 'partlyCloudy', high: 13 },
    { day: 'Thu', condition: 'sunny', high: 17 },
    { day: 'Fri', condition: 'windy', high: 12 },
    { day: 'Sat', condition: 'sunny', high: 18 },
  ],
  advice:
    'Battery Point streets are steep and cobbled — choose the Accessible route with a wheelchair or pram. Bring a layer: wind off kunanyi can drop the temperature quickly.',
}

export const BEST_COMFORT_SCORE = 80

/** Icon (AppIcon name) and forecast emoji for each condition (text: weather.conditions.*). */
export const CONDITIONS = {
  sunny: { icon: 'sun', emoji: '☀️' },
  partlyCloudy: { icon: 'weather', emoji: '⛅' },
  cloudy: { icon: 'cloud', emoji: '☁️' },
  rain: { icon: 'rain', emoji: '🌧️' },
  windy: { icon: 'wind', emoji: '💨' },
}

/**
 * Simulated "live" readings: the prototype steps through these every
 * LIVE_WEATHER_INTERVAL_MS so the Weather tab and page show conditions changing.
 * `verdict` is weather.verdicts.* (good / fair / poor for walking).
 */
export const LIVE_WEATHER = [
  { condition: 'partlyCloudy', temperature: 14, feelsLike: 12, wind: 18, rain: 10, verdict: 'good' },
  { condition: 'sunny', temperature: 16, feelsLike: 15, wind: 9, rain: 0, verdict: 'good' },
  { condition: 'cloudy', temperature: 13, feelsLike: 11, wind: 14, rain: 30, verdict: 'fair' },
  { condition: 'rain', temperature: 11, feelsLike: 8, wind: 22, rain: 80, verdict: 'poor' },
  { condition: 'windy', temperature: 12, feelsLike: 7, wind: 38, rain: 20, verdict: 'fair' },
]

export const LIVE_WEATHER_INTERVAL_MS = 10_000
