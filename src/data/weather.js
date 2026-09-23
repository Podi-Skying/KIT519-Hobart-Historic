/**
 * Static walking-conditions snapshot for the prototype.
 * Replace with a weather API response of the same shape when going live.
 */
export const WEATHER = {
  location: 'Hobart',
  current: {
    temperature: 14,
    feelsLike: 12,
    summary: 'Partly cloudy',
    verdict: 'Good for walking',
  },
  stats: [
    { icon: 'wind', label: 'Wind', value: '18 km/h' },
    { icon: 'drop', label: 'Rain', value: '10%' },
    { icon: 'sun', label: 'UV index', value: 'Low' },
  ],
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
  forecast: [
    { day: 'Now', icon: '⛅', high: 14 },
    { day: 'Mon', icon: '☀️', high: 16 },
    { day: 'Tue', icon: '🌧️', high: 11 },
    { day: 'Wed', icon: '⛅', high: 13 },
    { day: 'Thu', icon: '☀️', high: 17 },
    { day: 'Fri', icon: '💨', high: 12 },
    { day: 'Sat', icon: '☀️', high: 18 },
  ],
  advice:
    'Battery Point streets are steep and cobbled — choose the Accessible route with a wheelchair or pram. Bring a layer: wind off kunanyi can drop the temperature quickly.',
}

export const BEST_COMFORT_SCORE = 80
